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

describe("Tareas de equipo y proyecto (e2e)", () => {
	const t: Record<string, string> = {};
	const id: Record<string, number> = {};
	let acme: number;
	let equipo: number;
	let proyecto: number;
	let tareaEquipo: number;
	const org = (ruta: string) => `/api/organizaciones/${acme}${ruta}`;
	const post = async (ruta: string, token: string, body: unknown) =>
		api(ruta, { method: "POST", token, body });
	const put = async (ruta: string, token: string, body: unknown) =>
		api(ruta, { method: "PUT", token, body });

	beforeAll(async () => {
		await vaciarUsuarios();
		for (const quien of ["ana", "beto", "caro", "zoe"]) {
			await crearUsuario(`${quien}@compartida.dev`, "USUARIO");
			t[quien] = await login(`${quien}@compartida.dev`);
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
				email: `${quien}@compartida.dev`,
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
		// beto lidera; ana y caro no son delegadas.
		equipo = (
			await (
				await post(org("/equipos"), t.ana, {
					nombre: "Plataforma",
					color: "#6366f1",
					miembroIds: [id.ana, id.beto, id.caro],
					liderId: id.beto,
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

	it("con líder, solo él y sus delegados crean en el equipo (RN-22)", async () => {
		expect(
			(
				await post("/api/tareas", t.caro, {
					titulo: "No puedo",
					equipoId: equipo,
				})
			).status,
		).toBe(403);

		const crear = await post("/api/tareas", t.beto, {
			titulo: "Desplegar",
			equipoId: equipo,
			responsableIds: [id.caro],
		});
		expect(crear.status).toBe(201);
		const tarea = await crear.json();
		expect(tarea).toMatchObject({
			organizacionId: acme,
			equipoId: equipo,
			proyectoId: null,
			responsableIds: [id.caro],
		});
		tareaEquipo = tarea.id;
	});

	it("los miembros la ven y editan; sin ser líder no cambian responsables", async () => {
		const lista = await (
			await api(`/api/tareas?equipoId=${equipo}`, { token: t.caro })
		).json();
		expect(lista.datos.map((d: { id: number }) => d.id)).toEqual([tareaEquipo]);

		expect(
			(
				await put(`/api/tareas/${tareaEquipo}`, t.caro, {
					estado: "en_progreso",
				})
			).status,
		).toBe(200);
		expect(
			(
				await put(`/api/tareas/${tareaEquipo}`, t.caro, {
					responsableIds: [id.ana],
				})
			).status,
		).toBe(403);
		// No aparece entre las personales de quien la creó.
		const personales = await (
			await api("/api/tareas", { token: t.beto })
		).json();
		expect(personales.datos).toEqual([]);
	});

	it("pendientes incluye lo asignado (RN-43, RN-44)", async () => {
		const pendientes = await (
			await api("/api/tareas/pendientes", { token: t.caro })
		).json();
		expect(pendientes.datos.map((d: { id: number }) => d.id)).toContain(
			tareaEquipo,
		);
	});

	it("aislamiento: quien no es de la organización recibe 404 (RN-90)", async () => {
		expect(
			(await api(`/api/tareas/${tareaEquipo}`, { token: t.zoe })).status,
		).toBe(404);
		expect(
			(await api(`/api/tareas?equipoId=${equipo}`, { token: t.zoe })).status,
		).toBe(404);
		expect(
			(await post("/api/tareas", t.zoe, { titulo: "x", equipoId: equipo }))
				.status,
		).toBe(404);
	});

	it("mover personal → equipo respeta RN-22 y no tiene vuelta (RN-45)", async () => {
		const deAna = await (
			await post("/api/tareas", t.ana, { titulo: "Idea" })
		).json();
		expect(
			(await post(`/api/tareas/${deAna.id}/mover`, t.ana, { equipoId: equipo }))
				.status,
		).toBe(403);

		const deBeto = await (
			await post("/api/tareas", t.beto, { titulo: "Idea" })
		).json();
		const mover = await post(`/api/tareas/${deBeto.id}/mover`, t.beto, {
			equipoId: equipo,
		});
		expect(mover.status).toBe(200);
		expect((await mover.json()).equipoId).toBe(equipo);
		expect(
			(
				await post(`/api/tareas/${deBeto.id}/mover`, t.beto, {
					proyectoId: proyecto,
				})
			).status,
		).toBe(400);
	});

	it("en un proyecto crea cualquier miembro de sus equipos", async () => {
		const crear = await post("/api/tareas", t.caro, {
			titulo: "Notas de versión",
			proyectoId: proyecto,
		});
		expect(crear.status).toBe(201);
		const lista = await (
			await api(`/api/tareas?proyectoId=${proyecto}`, { token: t.ana })
		).json();
		expect(lista.totalElementos).toBe(1);
	});

	it("salir de la organización lo quita como responsable (decisión 20)", async () => {
		expect(
			(
				await api(org(`/miembros/${id.caro}`), {
					method: "DELETE",
					token: t.caro,
				})
			).status,
		).toBe(204);
		const tarea = await (
			await api(`/api/tareas/${tareaEquipo}`, { token: t.beto })
		).json();
		expect(tarea.responsableIds).toEqual([]);
		expect(
			(await api(`/api/tareas/${tareaEquipo}`, { token: t.caro })).status,
		).toBe(404);
	});
});
