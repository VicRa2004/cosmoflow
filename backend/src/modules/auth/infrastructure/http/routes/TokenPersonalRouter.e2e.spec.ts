import { beforeEach, describe, expect, it } from "bun:test";
import { prisma } from "@/core/config/prisma";
import { api, crearUsuario, login, vaciarUsuarios } from "@/test/e2e";

const RUTA = "/api/tokens-personales";

describe("Tokens personales (e2e)", () => {
	let jwt: string;
	let usuarioId: number;

	const crearToken = async (sesion = jwt, nombre = "Claude Code") => {
		const res = await api(RUTA, {
			method: "POST",
			token: sesion,
			body: { nombre },
		});
		expect(res.status).toBe(201);
		return (await res.json()) as { id: number; token: string; pista: string };
	};

	const estado = async (ruta: string, token: string) =>
		(await api(ruta, { token })).status;

	beforeEach(async () => {
		await vaciarUsuarios();
		usuarioId = (await crearUsuario("ana@x.com", "USUARIO")).id;
		jwt = await login("ana@x.com");
	});

	it("debería mostrar el token solo al crearlo y guardar únicamente su hash", async () => {
		const { id, token, pista } = await crearToken();

		expect(token).toMatch(/^cfp_[a-f0-9]{96}$/);
		expect(token.endsWith(pista)).toBe(true);

		const lista = await (await api(RUTA, { token: jwt })).json();
		expect(lista).toEqual([
			{ id, nombre: "Claude Code", pista, createdAt: expect.any(String) },
		]);

		const fila = await prisma.tokenPersonal.findUniqueOrThrow({
			where: { id },
		});
		expect(fila.tokenHash).not.toContain(token);
		expect(fila.tokenHash).toHaveLength(64);
	});

	it("debería autenticar con los mismos permisos que el usuario", async () => {
		const { token } = await crearToken();

		expect(await estado("/api/tareas", token)).toBe(200);
		// La auditoría es solo de ADMIN: el token no da más que la sesión.
		expect(await estado("/api/auditoria", jwt)).toBe(403);
		expect(await estado("/api/auditoria", token)).toBe(403);
	});

	it("debería dar 401 con un token inexistente", async () => {
		const { token } = await crearToken();

		expect(await estado("/api/tareas", `${token}0`)).toBe(401);
	});

	it("debería dar 401 al revocarlo y sacarlo de la lista", async () => {
		const { id, token } = await crearToken();

		const res = await api(`${RUTA}/${id}`, { method: "DELETE", token: jwt });

		expect(res.status).toBe(204);
		expect(await estado("/api/tareas", token)).toBe(401);
		expect(await (await api(RUTA, { token: jwt })).json()).toEqual([]);
		expect(
			(await api(`${RUTA}/${id}`, { method: "DELETE", token: jwt })).status,
		).toBe(404);
	});

	it("debería dar 401 si el usuario se elimina o se desactiva", async () => {
		const { token } = await crearToken();

		await prisma.usuario.update({
			where: { id: usuarioId },
			data: { isActivo: false },
		});
		expect(await estado("/api/tareas", token)).toBe(401);

		await prisma.usuario.update({
			where: { id: usuarioId },
			data: { isActivo: true, deletedAt: new Date() },
		});
		expect(await estado("/api/tareas", token)).toBe(401);
	});

	it("no debería ver ni revocar los tokens de otro usuario", async () => {
		const { id, token } = await crearToken();
		await crearUsuario("zoe@x.com", "USUARIO");
		const jwtZoe = await login("zoe@x.com");

		expect(await (await api(RUTA, { token: jwtZoe })).json()).toEqual([]);
		expect(
			(await api(`${RUTA}/${id}`, { method: "DELETE", token: jwtZoe })).status,
		).toBe(404);
		expect(await estado("/api/tareas", token)).toBe(200);
	});

	it("un token personal no debería gestionar tokens", async () => {
		const { id, token } = await crearToken();

		expect(await estado(RUTA, token)).toBe(403);
		expect(
			(await api(RUTA, { method: "POST", token, body: { nombre: "Otro" } }))
				.status,
		).toBe(403);
		expect(
			(await api(`${RUTA}/${id}`, { method: "DELETE", token })).status,
		).toBe(403);
	});

	it("no debería acceder a los datos de otra organización", async () => {
		const json = async (ruta: string, token: string, body: unknown) =>
			(await (await api(ruta, { method: "POST", token, body })).json()) as {
				id: number;
			};
		const color = "#6366f1";
		const org = await json("/api/organizaciones", jwt, {
			nombre: "Acme",
			color,
		});
		const acme = `/api/organizaciones/${org.id}`;
		const tarea = await json("/api/tareas", jwt, {
			titulo: "Interna",
			organizacionId: org.id,
		});
		await crearUsuario("zoe@x.com", "USUARIO");
		const { token: deZoe } = await crearToken(await login("zoe@x.com"));
		const { token: deAna } = await crearToken();

		// Control: el mismo tipo de token sí entra en su propia organización.
		expect(await estado(acme, deAna)).toBe(200);
		expect(await estado(`/api/tareas/${tarea.id}`, deAna)).toBe(200);

		for (const ruta of [
			acme,
			`${acme}/miembros`,
			`${acme}/equipos`,
			`${acme}/proyectos`,
			`/api/tareas/${tarea.id}`,
			`/api/tareas?organizacionId=${org.id}`,
		]) {
			expect([ruta, await estado(ruta, deZoe)]).toEqual([ruta, 404]);
		}
		expect(
			(
				await api(`/api/tareas/${tarea.id}`, {
					method: "PUT",
					token: deZoe,
					body: { estado: "completada" },
				})
			).status,
		).toBe(404);
	});
});
