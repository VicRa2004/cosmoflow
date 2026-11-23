import { beforeAll, describe, expect, it, spyOn } from "bun:test";
import type { Correo } from "@/core/shared/domain/Mailer";
import { container } from "@/core/shared/infrastructure/di/container";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { api, crearUsuario, login } from "@/test/e2e";

const correos: Correo[] = [];
spyOn(container.get(TOKENS.Mailer), "enviar").mockImplementation(
	async (correo) => {
		correos.push(correo);
	},
);

// Emails propios, sin vaciar: no pisa a los demás e2e.
describe("Plantillas de tareas (e2e)", () => {
	const t: Record<string, string> = {};
	let acme: number;
	const deOrg = (ruta = "") => `/api/organizaciones/${acme}/plantillas${ruta}`;
	const plantilla = {
		nombre: "Release",
		titulo: "Publicar versión",
		contenido: "## Pasos",
		prioridad: "alta",
		color: "#6366f1",
		subtareas: ["Subir versión", "Etiquetar"],
	};

	beforeAll(async () => {
		for (const quien of ["ana", "beto", "zoe"]) {
			await crearUsuario(`${quien}@plantillas.dev`, "USUARIO");
			t[quien] = await login(`${quien}@plantillas.dev`);
		}
		acme = (
			await (
				await api("/api/organizaciones", {
					method: "POST",
					token: t.ana,
					body: { nombre: "Acme", color: "#6366f1" },
				})
			).json()
		).id;
		await api(`/api/organizaciones/${acme}/invitaciones`, {
			method: "POST",
			token: t.ana,
			body: { email: "beto@plantillas.dev" },
		});
		await api("/api/invitaciones/aceptar", {
			method: "POST",
			token: t.beto,
			body: { token: correos.at(-1)?.texto.match(/token=([a-f0-9]{64})/)?.[1] },
		});
	});

	it("las personales solo las ve y cambia su dueño", async () => {
		const creada = await api("/api/plantillas", {
			method: "POST",
			token: t.ana,
			body: { nombre: "Mínima", titulo: "Algo" },
		});
		expect(creada.status).toBe(201);
		const { id, ...resto } = await creada.json();
		expect(resto).toEqual({
			nombre: "Mínima",
			titulo: "Algo",
			contenido: "",
			prioridad: "media",
			color: null,
			subtareas: [],
		});

		expect(
			await (await api("/api/plantillas", { token: t.zoe })).json(),
		).toEqual([]);
		const ajena = await api(`/api/plantillas/${id}`, {
			method: "PUT",
			token: t.zoe,
			body: { nombre: "Mía" },
		});
		expect(ajena.status).toBe(404);

		const cambiada = await api(`/api/plantillas/${id}`, {
			method: "PUT",
			token: t.ana,
			body: { subtareas: ["Uno"] },
		});
		expect((await cambiada.json()).subtareas).toEqual(["Uno"]);
		expect(
			(await api(`/api/plantillas/${id}`, { method: "DELETE", token: t.ana }))
				.status,
		).toBe(204);
		expect(
			await (await api("/api/plantillas", { token: t.ana })).json(),
		).toEqual([]);
	});

	it("de organización: el admin gestiona, un miembro solo lee y un ajeno no las ve", async () => {
		const creada = await api(deOrg(), {
			method: "POST",
			token: t.ana,
			body: plantilla,
		});
		expect(creada.status).toBe(201);
		const { id } = await creada.json();

		expect(await (await api(deOrg(), { token: t.beto })).json()).toEqual([
			{ id, ...plantilla },
		]);
		const porBeto = await api(deOrg(`/${id}`), {
			method: "DELETE",
			token: t.beto,
		});
		expect(porBeto.status).toBe(403);
		expect((await api(deOrg(), { token: t.zoe })).status).toBe(404);
		// La de la organización no aparece entre las personales de quien la creó.
		expect(
			await (await api("/api/plantillas", { token: t.ana })).json(),
		).toEqual([]);
	});

	it("valida los campos", async () => {
		const res = await api("/api/plantillas", {
			method: "POST",
			token: t.ana,
			body: { nombre: " ", titulo: "x", subtareas: [""] },
		});
		expect(res.status).toBe(400);
	});
});
