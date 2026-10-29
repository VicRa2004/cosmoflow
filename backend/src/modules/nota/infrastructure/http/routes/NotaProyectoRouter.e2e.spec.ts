import { beforeAll, describe, expect, it, spyOn } from "bun:test";
import type { Correo } from "@/core/shared/domain/Mailer";
import { container } from "@/core/shared/infrastructure/di/container";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { app } from "@/core/shared/infrastructure/http/server";
import { api, crearUsuario, login, vaciarUsuarios } from "@/test/e2e";

const correos: Correo[] = [];
spyOn(container.get(TOKENS.Mailer), "enviar").mockImplementation(
	async (correo) => {
		correos.push(correo);
	},
);

const PNG = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2,
]);

function subir(token: string, query = "") {
	const form = new FormData();
	form.append("archivo", new File([PNG], "a.png", { type: "image/png" }));
	return app.request(`/api/adjuntos${query}`, {
		method: "POST",
		headers: { Authorization: `Bearer ${token}` },
		body: form,
	});
}

describe("Notas de proyecto e imágenes compartidas (e2e)", () => {
	const t: Record<string, string> = {};
	const id: Record<string, number> = {};
	let acme: number;
	let equipo: number;
	let proyecto: number;
	let nota: number;
	const org = (ruta: string) => `/api/organizaciones/${acme}${ruta}`;
	const post = async (ruta: string, token: string, body: unknown) =>
		api(ruta, { method: "POST", token, body });

	beforeAll(async () => {
		await vaciarUsuarios();
		for (const quien of ["ana", "beto", "caro", "zoe"]) {
			await crearUsuario(`${quien}@notaproy.dev`, "USUARIO");
			t[quien] = await login(`${quien}@notaproy.dev`);
		}
		acme = (
			await (
				await post("/api/organizaciones", t.ana, {
					nombre: "Acme",
					color: "#6366f1",
				})
			).json()
		).id;
		for (const quien of ["beto", "caro"]) {
			await post(org("/invitaciones"), t.ana, {
				email: `${quien}@notaproy.dev`,
			});
			await post("/api/invitaciones/aceptar", t[quien], {
				token: correos.at(-1)?.texto.match(/token=([a-f0-9]{64})/)?.[1],
			});
		}
		const miembros = await (
			await api(org("/miembros"), { token: t.ana })
		).json();
		for (const m of miembros as { email: string; usuarioId: number }[]) {
			id[m.email.split("@")[0]] = m.usuarioId;
		}
		// caro es de la organización pero no del proyecto.
		equipo = (
			await (
				await post(org("/equipos"), t.ana, {
					nombre: "Plataforma",
					color: "#6366f1",
					miembroIds: [id.ana, id.beto],
				})
			).json()
		).id;
		proyecto = (
			await (
				await post(org("/proyectos"), t.ana, {
					nombre: "Lanzamiento",
					equipoIds: [equipo],
				})
			).json()
		).id;
	});

	it("un miembro del proyecto crea; los demás miembros la ven (RN-33)", async () => {
		const crear = await post("/api/notas", t.beto, {
			titulo: "Acta",
			proyectoId: proyecto,
		});
		expect(crear.status).toBe(201);
		nota = (await crear.json()).id;

		const lista = await (
			await api(`/api/notas?proyectoId=${proyecto}`, { token: t.ana })
		).json();
		expect(lista.datos.map((n: { id: number }) => n.id)).toEqual([nota]);
		expect(
			(
				await api(`/api/notas/${nota}`, {
					method: "PUT",
					token: t.ana,
					body: { titulo: "Acta v2" },
				})
			).status,
		).toBe(200);
		// No aparece entre las personales de quien la creó.
		const personales = await (
			await api("/api/notas", { token: t.beto })
		).json();
		expect(personales.datos).toEqual([]);
	});

	it("ni la organización ni otros usuarios la ven si no son del proyecto (RN-90)", async () => {
		for (const quien of ["caro", "zoe"]) {
			expect(
				(await api(`/api/notas/${nota}`, { token: t[quien] })).status,
			).toBe(404);
			expect(
				(await api(`/api/notas?proyectoId=${proyecto}`, { token: t[quien] }))
					.status,
			).toBe(404);
		}
		expect(
			(await post("/api/notas", t.caro, { titulo: "x", proyectoId: proyecto }))
				.status,
		).toBe(404);
	});

	it("usa los tags de la organización, no los personales (RN-60)", async () => {
		const deOrg = await (
			await post(org("/tags"), t.ana, { nombre: "acta" })
		).json();
		const personal = await (
			await post("/api/tags", t.beto, { nombre: "mio" })
		).json();
		const ruta = `/api/notas/${nota}`;
		const put = (tagIds: number[]) =>
			api(ruta, { method: "PUT", token: t.beto, body: { tagIds } });
		expect((await put([personal.id])).status).toBe(400);
		expect((await put([deOrg.id])).status).toBe(200);
	});

	it("una imagen subida para el proyecto la ven sus miembros y nadie más", async () => {
		const compartida = await (
			await subir(t.beto, `?proyectoId=${proyecto}`)
		).json();
		expect((await api(compartida.url, { token: t.ana })).status).toBe(200);
		expect((await api(compartida.url, { token: t.caro })).status).toBe(404);

		const privada = await (await subir(t.beto)).json();
		expect((await api(privada.url, { token: t.ana })).status).toBe(404);

		expect((await subir(t.caro, `?proyectoId=${proyecto}`)).status).toBe(404);
	});

	it("al mover una tarea, sus imágenes pasan a verse en el equipo", async () => {
		const imagen = await (await subir(t.ana)).json();
		const tarea = await (
			await post("/api/tareas", t.ana, {
				titulo: "Con captura",
				contenido: `![](${imagen.url})`,
			})
		).json();
		expect((await api(imagen.url, { token: t.beto })).status).toBe(404);

		expect(
			(await post(`/api/tareas/${tarea.id}/mover`, t.ana, { equipoId: equipo }))
				.status,
		).toBe(200);
		expect((await api(imagen.url, { token: t.beto })).status).toBe(200);
		expect((await api(imagen.url, { token: t.caro })).status).toBe(404);
	});
});
