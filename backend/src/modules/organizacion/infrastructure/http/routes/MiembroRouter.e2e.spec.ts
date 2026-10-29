import { beforeAll, describe, expect, it, spyOn } from "bun:test";
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

describe("Miembros (e2e)", () => {
	const tokens: Record<string, string> = {};
	const ids: Record<string, number> = {};
	let orgId: number;
	const url = (ruta = "") => `/api/organizaciones/${orgId}${ruta}`;

	/** Invita y acepta: la única vía de entrar (RN-12). */
	async function unir(quien: string) {
		await api(url("/invitaciones"), {
			method: "POST",
			token: tokens.ana,
			body: { email: `${quien}@miem.dev` },
		});
		const token = correos.at(-1)?.texto.match(/token=([a-f0-9]{64})/)?.[1];
		await api("/api/invitaciones/aceptar", {
			method: "POST",
			token: tokens[quien],
			body: { token },
		});
	}

	beforeAll(async () => {
		await vaciarUsuarios();
		for (const quien of ["ana", "beto", "carla", "dani"]) {
			ids[quien] = (await crearUsuario(`${quien}@miem.dev`, "USUARIO")).id;
			tokens[quien] = await login(`${quien}@miem.dev`);
		}
		const res = await api("/api/organizaciones", {
			method: "POST",
			token: tokens.ana,
			body: { nombre: "Acme", color: "#6366f1" },
		});
		orgId = (await res.json()).id;
		await unir("beto");
		await unir("carla");
	});

	it("los miembros se ven entre sí; quien no es miembro, no (404)", async () => {
		const res = await api(url("/miembros"), { token: tokens.beto });
		const miembros = await res.json();
		expect(miembros.map((m: { email: string }) => m.email)).toEqual([
			"ana@miem.dev",
			"beto@miem.dev",
			"carla@miem.dev",
		]);
		expect(miembros[0]).toMatchObject({ isAdmin: true });
		expect((await api(url("/miembros"), { token: tokens.dani })).status).toBe(
			404,
		);
	});

	it("solo el admin expulsa, y el expulsado pierde el acceso", async () => {
		const porBeto = await api(url(`/miembros/${ids.carla}`), {
			method: "DELETE",
			token: tokens.beto,
		});
		expect(porBeto.status).toBe(403);

		const porAna = await api(url(`/miembros/${ids.carla}`), {
			method: "DELETE",
			token: tokens.ana,
		});
		expect(porAna.status).toBe(204);
		expect((await api(url(), { token: tokens.carla })).status).toBe(404);
	});

	it("el admin no sale sin delegar (RN-16); tras delegar, sí", async () => {
		const salir = () =>
			api(url(`/miembros/${ids.ana}`), { method: "DELETE", token: tokens.ana });
		expect((await salir()).status).toBe(409);

		const delegarBeto = await api(url("/delegar"), {
			method: "POST",
			token: tokens.beto,
			body: { usuarioId: ids.ana },
		});
		expect(delegarBeto.status).toBe(403);

		const delegar = await api(url("/delegar"), {
			method: "POST",
			token: tokens.ana,
			body: { usuarioId: ids.beto },
		});
		expect(delegar.status).toBe(204);
		const vista = await api(url(), { token: tokens.beto });
		expect(await vista.json()).toMatchObject({ isAdmin: true });

		expect((await salir()).status).toBe(204);
		expect((await api(url(), { token: tokens.ana })).status).toBe(404);
	});

	it("no se delega en quien no es miembro", async () => {
		const res = await api(url("/delegar"), {
			method: "POST",
			token: tokens.beto,
			body: { usuarioId: ids.dani },
		});
		expect(res.status).toBe(404);
	});
});
