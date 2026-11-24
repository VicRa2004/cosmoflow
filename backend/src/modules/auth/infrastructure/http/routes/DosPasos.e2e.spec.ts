import { beforeAll, describe, expect, it } from "bun:test";
import { prisma } from "@/core/config/prisma";
import {
	api,
	crearUsuario,
	despacharEventos,
	login,
	PASSWORD,
	refreshCookie,
	vaciarUsuarios,
} from "@/test/e2e";
import {
	base32Decodificar,
	codigoTotp,
	pasoActual,
} from "../../../domain/totp";

const EMAIL = "totp@e2e.dev";
let ipLibre = 1;
const ip = () => `10.0.7.${ipLibre++}`;

const codigoDe = (secreto: string, paso = pasoActual(Date.now())) =>
	codigoTotp(base32Decodificar(secreto), paso);

const loginPassword = () =>
	api("/api/auth/login", {
		method: "POST",
		body: { email: EMAIL, password: PASSWORD },
		ip: ip(),
	});

async function tokenDosPasos(): Promise<string> {
	const res = await loginPassword();
	expect(res.status).toBe(200);
	const cuerpo = await res.json();
	expect(cuerpo).toEqual({
		requiereDosPasos: true,
		tokenDosPasos: expect.any(String),
	});
	// Sin sesión hasta el segundo paso.
	expect(res.headers.getSetCookie()).toHaveLength(0);
	return cuerpo.tokenDosPasos;
}

const segundoPaso = (token: string, codigo: string) =>
	api("/api/auth/login/dos-pasos", {
		method: "POST",
		body: { tokenDosPasos: token, codigo },
		ip: ip(),
	});

describe("Verificación en dos pasos (e2e)", () => {
	let accessToken: string;
	let usuarioId: number;
	let secreto: string;
	/** Paso del código de activación: los siguientes se calculan desde él (sin depender del reloj). */
	let pasoActivacion: number;
	let codigosRecuperacion: string[];

	beforeAll(async () => {
		await vaciarUsuarios();
		await prisma.auditoria.deleteMany();
		usuarioId = (await crearUsuario(EMAIL)).id;
		accessToken = await login(EMAIL);
	});

	it("activar: QR → primer código → códigos de recuperación; el secreto se guarda cifrado", async () => {
		const estado = await api("/api/auth/dos-pasos", { token: accessToken });
		expect(await estado.json()).toEqual({
			isActivo: false,
			codigosRestantes: 0,
		});

		const iniciar = await api("/api/auth/dos-pasos/iniciar", {
			method: "POST",
			token: accessToken,
		});
		expect(iniciar.status).toBe(200);
		const cuerpo = await iniciar.json();
		secreto = cuerpo.secreto;
		expect(cuerpo.uri).toContain(`secret=${secreto}`);

		const fila = await prisma.dosPasos.findUniqueOrThrow({
			where: { usuarioId },
		});
		expect(fila.secretoCifrado).not.toContain(secreto);
		expect(fila.activadoEn).toBeNull();

		const activar = (codigo: string) =>
			api("/api/auth/dos-pasos/activar", {
				method: "POST",
				token: accessToken,
				body: { codigo },
				ip: ip(),
			});
		const incorrecto = codigoDe(secreto) === "000000" ? "111111" : "000000";
		expect((await activar(incorrecto)).status).toBe(400);

		pasoActivacion = pasoActual(Date.now());
		const activada = await activar(codigoDe(secreto, pasoActivacion));
		expect(activada.status).toBe(200);
		codigosRecuperacion = (await activada.json()).codigosRecuperacion;
		expect(codigosRecuperacion).toHaveLength(10);

		const guardados = await prisma.codigoRecuperacion.findMany({
			where: { usuarioId },
		});
		expect(guardados).toHaveLength(10);
		expect(guardados.map((c) => c.codigoHash)).not.toContain(
			codigosRecuperacion[0],
		);

		const despues = await api("/api/auth/dos-pasos", { token: accessToken });
		expect(await despues.json()).toEqual({
			isActivo: true,
			codigosRestantes: 10,
		});
	});

	it("login: contraseña → token intermedio → código; un código no vale dos veces", async () => {
		const token = await tokenDosPasos();

		// El código usado al activar ya no vale (anti-repetición).
		expect(
			(await segundoPaso(token, codigoDe(secreto, pasoActivacion))).status,
		).toBe(401);

		const ok = await segundoPaso(token, codigoDe(secreto, pasoActivacion + 1));
		expect(ok.status).toBe(200);
		expect((await ok.json()).usuario.email).toBe(EMAIL);
		expect(refreshCookie(ok)).toStartWith("refresh_token=");

		expect(
			(await segundoPaso(token, codigoDe(secreto, pasoActivacion + 1))).status,
		).toBe(401);
	});

	it("el token intermedio no sirve como access token", async () => {
		const token = await tokenDosPasos();
		const res = await api("/api/auth/dos-pasos", { token });
		expect(res.status).toBe(401);
		expect((await segundoPaso(accessToken, "123456")).status).toBe(401);
	});

	it("código de recuperación: entra una sola vez", async () => {
		const codigo = (codigosRecuperacion[0] as string).toUpperCase();
		expect((await segundoPaso(await tokenDosPasos(), codigo)).status).toBe(200);
		expect((await segundoPaso(await tokenDosPasos(), codigo)).status).toBe(401);

		const estado = await api("/api/auth/dos-pasos", { token: accessToken });
		expect((await estado.json()).codigosRestantes).toBe(9);
	});

	it("5 códigos incorrectos bloquean la cuenta, también para la contraseña", async () => {
		const desbloquear = () =>
			prisma.usuario.update({
				where: { id: usuarioId },
				data: { bloqueadoHasta: null, intentosFallidos: 0 },
			});
		// Los fallos de los tests anteriores también cuentan: se parte de cero.
		await desbloquear();
		const token = await tokenDosPasos();
		for (let i = 0; i < 5; i++) {
			expect((await segundoPaso(token, "zzzzz-zzzzz")).status).toBe(401);
		}
		expect((await segundoPaso(token, codigoDe(secreto))).status).toBe(429);
		expect((await loginPassword()).status).toBe(429);

		await desbloquear();
	});

	it("desactivar pide la contraseña (o un código) y queda auditado", async () => {
		const desactivar = (body: object) =>
			api("/api/auth/dos-pasos/desactivar", {
				method: "POST",
				token: accessToken,
				body,
				ip: ip(),
			});

		expect((await desactivar({})).status).toBe(400);
		expect((await desactivar({ password: "otra" })).status).toBe(400);
		expect((await desactivar({ password: PASSWORD })).status).toBe(200);

		const res = await loginPassword();
		expect((await res.json()).accessToken).toEqual(expect.any(String));
		expect(
			await prisma.codigoRecuperacion.count({ where: { usuarioId } }),
		).toBe(0);

		await despacharEventos();
		const eventos = await prisma.auditoria.findMany({
			where: { evento: { startsWith: "auth.dosPasos" } },
			orderBy: { id: "asc" },
		});
		expect(eventos.map((e) => [e.evento, e.usuarioId])).toEqual([
			["auth.dosPasosActivado", usuarioId],
			["auth.dosPasosDesactivado", usuarioId],
		]);
	});
});
