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

describe("Tags de organización (e2e)", () => {
	const t: Record<string, string> = {};
	let acme: number;
	let otra: number;
	const tags = (org: number, ruta = "") =>
		`/api/organizaciones/${org}/tags${ruta}`;

	beforeAll(async () => {
		await vaciarUsuarios();
		for (const quien of ["ana", "beto", "zoe"]) {
			await crearUsuario(`${quien}@tagorg.dev`, "USUARIO");
			t[quien] = await login(`${quien}@tagorg.dev`);
		}
		const crearOrg = async (token: string) =>
			(
				await (
					await api("/api/organizaciones", {
						method: "POST",
						token,
						body: { nombre: "Org", color: "#6366f1" },
					})
				).json()
			).id as number;
		acme = await crearOrg(t.ana);
		otra = await crearOrg(t.zoe);
		// beto entra en Acme como miembro sin roles.
		await api(`/api/organizaciones/${acme}/invitaciones`, {
			method: "POST",
			token: t.ana,
			body: { email: "beto@tagorg.dev" },
		});
		await api("/api/invitaciones/aceptar", {
			method: "POST",
			token: t.beto,
			body: { token: correos.at(-1)?.texto.match(/token=([a-f0-9]{64})/)?.[1] },
		});
	});

	it("el admin crea; un miembro lee pero sin tags:gestionar no escribe", async () => {
		const crear = await api(tags(acme), {
			method: "POST",
			token: t.ana,
			body: { nombre: "backend" },
		});
		expect(crear.status).toBe(201);
		const { id } = await crear.json();

		const lista = await (await api(tags(acme), { token: t.beto })).json();
		expect(lista.datos).toEqual([{ id, nombre: "backend" }]);

		const porBeto = await api(tags(acme), {
			method: "POST",
			token: t.beto,
			body: { nombre: "frontend" },
		});
		expect(porBeto.status).toBe(403);
		expect(
			(await api(tags(acme, `/${id}`), { method: "DELETE", token: t.beto }))
				.status,
		).toBe(403);
	});

	it("con un rol que da tags:gestionar el miembro sí escribe", async () => {
		const rol = await (
			await api(`/api/organizaciones/${acme}/roles`, {
				method: "POST",
				token: t.ana,
				body: { nombre: "Etiquetador", permisos: ["tags:gestionar"] },
			})
		).json();
		const miembros = await (
			await api(`/api/organizaciones/${acme}/miembros`, { token: t.ana })
		).json();
		const beto = miembros.find(
			(m: { email: string }) => m.email === "beto@tagorg.dev",
		);
		await api(`/api/organizaciones/${acme}/miembros/${beto.usuarioId}/roles`, {
			method: "PUT",
			token: t.ana,
			body: { rolIds: [rol.id] },
		});

		const crear = await api(tags(acme), {
			method: "POST",
			token: t.beto,
			body: { nombre: "frontend" },
		});
		expect(crear.status).toBe(201);
	});

	it("no se mezclan con los personales ni con los de otra organización", async () => {
		const [backend] = (
			await (await api(tags(acme, "?nombre=backend"), { token: t.ana })).json()
		).datos;

		// El mismo nombre puede existir como tag personal.
		expect(
			(
				await api("/api/tags", {
					method: "POST",
					token: t.ana,
					body: { nombre: "backend" },
				})
			).status,
		).toBe(201);
		const personales = await (await api("/api/tags", { token: t.ana })).json();
		expect(personales.datos.map((d: { id: number }) => d.id)).not.toContain(
			backend.id,
		);
		expect(
			(await api(`/api/tags/${backend.id}`, { token: t.ana })).status,
		).toBe(404);

		// Quien no es miembro: 404, también si conoce el id.
		expect((await api(tags(acme), { token: t.zoe })).status).toBe(404);
		expect(
			(await api(tags(acme, `/${backend.id}`), { token: t.zoe })).status,
		).toBe(404);
		// Un tag de Acme pedido por la ruta de otra organización no existe.
		expect(
			(await api(tags(otra, `/${backend.id}`), { token: t.zoe })).status,
		).toBe(404);
	});
});
