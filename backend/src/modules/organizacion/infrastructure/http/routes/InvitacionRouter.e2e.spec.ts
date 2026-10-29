import { beforeAll, describe, expect, it, spyOn } from "bun:test";
import { prisma } from "@/core/config/prisma";
import type { Correo } from "@/core/shared/domain/Mailer";
import { container } from "@/core/shared/infrastructure/di/container";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { api, crearUsuario, login, vaciarUsuarios } from "@/test/e2e";

const correos: Correo[] = [];
spyOn(container.get(TOKENS.Mailer), "enviar").mockImplementation(
	async (correo) => {
		correos.push(correo);
	},
);

/** Token del último correo enviado a `para`. */
function tokenEnviadoA(para: string): string {
	const token = correos
		.findLast((c) => c.para === para)
		?.texto.match(/token=([a-f0-9]{64})/)?.[1];
	if (!token) throw new Error(`No se envió ninguna invitación a ${para}`);
	return token;
}

describe("Invitaciones (e2e)", () => {
	let ana: string;
	let beto: string;
	let carla: string;
	let orgId: number;
	const invitaciones = () => `/api/organizaciones/${orgId}/invitaciones`;

	beforeAll(async () => {
		await vaciarUsuarios();
		for (const email of ["ana@inv.dev", "beto@inv.dev", "carla@inv.dev"]) {
			await crearUsuario(email, "USUARIO");
		}
		ana = await login("ana@inv.dev");
		beto = await login("beto@inv.dev");
		carla = await login("carla@inv.dev");
		const res = await api("/api/organizaciones", {
			method: "POST",
			token: ana,
			body: { nombre: "Acme", color: "#6366f1" },
		});
		orgId = (await res.json()).id;
	});

	it("el admin invita; el invitado acepta y queda como miembro", async () => {
		const res = await api(invitaciones(), {
			method: "POST",
			token: ana,
			body: { email: "Beto@Inv.dev" },
		});
		expect(res.status).toBe(201);
		expect(await res.json()).toMatchObject({ email: "beto@inv.dev" });
		const token = tokenEnviadoA("beto@inv.dev");

		// El token nunca se guarda en claro.
		expect(await prisma.invitacion.count({ where: { tokenHash: token } })).toBe(
			0,
		);

		const consulta = await api("/api/invitaciones/consultar", {
			method: "POST",
			token: beto,
			body: { token },
		});
		expect(await consulta.json()).toEqual({
			nombreOrganizacion: "Acme",
			email: "beto@inv.dev",
			isVigente: true,
		});

		const aceptar = await api("/api/invitaciones/aceptar", {
			method: "POST",
			token: beto,
			body: { token },
		});
		expect(await aceptar.json()).toEqual({ organizacionId: orgId });
		const vista = await api(`/api/organizaciones/${orgId}`, { token: beto });
		expect(await vista.json()).toMatchObject({ isAdmin: false });

		// Un solo uso.
		const otraVez = await api("/api/invitaciones/aceptar", {
			method: "POST",
			token: beto,
			body: { token },
		});
		expect(otraVez.status).toBe(410);

		// Ya es miembro: no se le vuelve a invitar.
		const repetir = await api(invitaciones(), {
			method: "POST",
			token: ana,
			body: { email: "beto@inv.dev" },
		});
		expect(repetir.status).toBe(409);
	});

	it("solo la cuenta del email invitado puede usar el enlace (403)", async () => {
		await api(invitaciones(), {
			method: "POST",
			token: ana,
			body: { email: "carla@inv.dev" },
		});
		const token = tokenEnviadoA("carla@inv.dev");
		for (const accion of ["consultar", "aceptar", "rechazar"]) {
			const res = await api(`/api/invitaciones/${accion}`, {
				method: "POST",
				token: beto,
				body: { token },
			});
			expect(res.status).toBe(403);
		}
	});

	it("reenviar invalida el enlace anterior; cancelar lo invalida del todo", async () => {
		const viejo = tokenEnviadoA("carla@inv.dev");
		const [pendiente] = await (
			await api(invitaciones(), { token: ana })
		).json();
		expect(pendiente).toMatchObject({ email: "carla@inv.dev" });

		const reenviar = await api(`${invitaciones()}/${pendiente.id}/reenviar`, {
			method: "POST",
			token: ana,
		});
		expect(reenviar.status).toBe(200);
		const nuevo = tokenEnviadoA("carla@inv.dev");
		expect(nuevo).not.toBe(viejo);
		const conViejo = await api("/api/invitaciones/aceptar", {
			method: "POST",
			token: carla,
			body: { token: viejo },
		});
		expect(conViejo.status).toBe(404);

		const cancelar = await api(`${invitaciones()}/${pendiente.id}`, {
			method: "DELETE",
			token: ana,
		});
		expect(cancelar.status).toBe(204);
		const conNuevo = await api("/api/invitaciones/aceptar", {
			method: "POST",
			token: carla,
			body: { token: nuevo },
		});
		expect(conNuevo.status).toBe(410);
		expect(await (await api(invitaciones(), { token: ana })).json()).toEqual(
			[],
		);
	});

	it("rechazar no da acceso", async () => {
		await api(invitaciones(), {
			method: "POST",
			token: ana,
			body: { email: "carla@inv.dev" },
		});
		const rechazar = await api("/api/invitaciones/rechazar", {
			method: "POST",
			token: carla,
			body: { token: tokenEnviadoA("carla@inv.dev") },
		});
		expect(rechazar.status).toBe(200);
		expect(
			(await api(`/api/organizaciones/${orgId}`, { token: carla })).status,
		).toBe(404);
	});

	it("solo el admin gestiona invitaciones; un no miembro ni las ve", async () => {
		// beto es miembro sin ser admin; carla no es miembro.
		const comoMiembro = await api(invitaciones(), {
			method: "POST",
			token: beto,
			body: { email: "x@inv.dev" },
		});
		expect(comoMiembro.status).toBe(403);
		expect((await api(invitaciones(), { token: beto })).status).toBe(403);
		expect((await api(invitaciones(), { token: carla })).status).toBe(404);
		expect(
			(
				await api(invitaciones(), {
					method: "POST",
					token: carla,
					body: { email: "x@inv.dev" },
				})
			).status,
		).toBe(404);
		expect(correos.some((c) => c.para === "x@inv.dev")).toBe(false);
	});
});
