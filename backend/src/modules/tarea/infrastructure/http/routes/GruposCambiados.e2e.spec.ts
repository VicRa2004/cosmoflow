import { beforeAll, describe, expect, it, spyOn } from "bun:test";
import type { Correo } from "@/core/shared/domain/Mailer";
import { container } from "@/core/shared/infrastructure/di/container";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import {
	api,
	crearUsuario,
	despacharEventos,
	login,
	vaciarUsuarios,
} from "@/test/e2e";

const correos: Correo[] = [];
spyOn(container.get(TOKENS.Mailer), "enviar").mockImplementation(
	async (correo) => {
		correos.push(correo);
	},
);

describe("Equipos y proyectos que cambian o se eliminan (e2e)", () => {
	const t: Record<string, string> = {};
	const id: Record<string, number> = {};
	let acme: number;
	let plataforma: number;
	let web: number;
	let proyecto: number;
	let tareaEquipo: number;
	let tareaProyecto: number;
	let nota: number;
	const org = (ruta: string) => `/api/organizaciones/${acme}${ruta}`;
	const enviar = async (
		method: string,
		ruta: string,
		token: string,
		body?: unknown,
	) => {
		const res = await api(ruta, { method, token, body });
		await despacharEventos();
		return res;
	};
	const json = async (ruta: string, token: string) =>
		(await api(ruta, { token })).json();

	beforeAll(async () => {
		await vaciarUsuarios();
		for (const quien of ["ana", "beto", "caro"]) {
			await crearUsuario(`${quien}@grupos.dev`, "USUARIO");
			t[quien] = await login(`${quien}@grupos.dev`);
		}
		acme = (
			await (
				await enviar("POST", "/api/organizaciones", t.ana, {
					nombre: "Acme",
					color: "#6366f1",
				})
			).json()
		).id;
		for (const quien of ["beto", "caro"]) {
			await enviar("POST", org("/invitaciones"), t.ana, {
				email: `${quien}@grupos.dev`,
			});
			await enviar("POST", "/api/invitaciones/aceptar", t[quien], {
				token: correos.at(-1)?.texto.match(/token=([a-f0-9]{64})/)?.[1],
			});
		}
		for (const m of (await json(org("/miembros"), t.ana)) as {
			email: string;
			usuarioId: number;
		}[]) {
			id[m.email.split("@")[0]] = m.usuarioId;
		}
		const crearEquipo = async (nombre: string, miembroIds: number[]) =>
			(
				await (
					await enviar("POST", org("/equipos"), t.ana, {
						nombre,
						color: "#6366f1",
						miembroIds,
					})
				).json()
			).id as number;
		plataforma = await crearEquipo("Plataforma", [id.ana, id.beto, id.caro]);
		web = await crearEquipo("Web", [id.ana, id.beto]);
		proyecto = (
			await (
				await enviar("POST", org("/proyectos"), t.ana, {
					nombre: "Lanzamiento",
					equipoIds: [web],
					integranteIds: [id.caro],
				})
			).json()
		).id;
		const crear = async (body: unknown) =>
			(await (await enviar("POST", "/api/tareas", t.ana, body)).json())
				.id as number;
		tareaEquipo = await crear({
			titulo: "Desplegar",
			equipoId: plataforma,
			responsableIds: [id.beto, id.caro],
		});
		tareaProyecto = await crear({
			titulo: "Notas de versión",
			proyectoId: proyecto,
			responsableIds: [id.beto, id.caro],
		});
		nota = (
			await (
				await enviar("POST", "/api/notas", t.caro, {
					titulo: "Ideas",
					proyectoId: proyecto,
				})
			).json()
		).id;
	});

	it("quien sale de un equipo deja de ser responsable de sus tareas", async () => {
		const res = await enviar("PUT", org(`/equipos/${plataforma}`), t.ana, {
			miembroIds: [id.ana, id.beto],
		});
		expect(res.status).toBe(200);
		const tarea = await json(`/api/tareas/${tareaEquipo}`, t.ana);
		expect(tarea.responsableIds).toEqual([id.beto]);
	});

	it("quien deja de ver un proyecto deja de ser responsable; los de sus equipos siguen", async () => {
		const res = await enviar("PUT", org(`/proyectos/${proyecto}`), t.ana, {
			integranteIds: [],
		});
		expect(res.status).toBe(200);
		const tarea = await json(`/api/tareas/${tareaProyecto}`, t.ana);
		expect(tarea.responsableIds).toEqual([id.beto]);
	});

	it("al eliminar un proyecto sus tareas pasan a la organización y sus notas a quien las creó", async () => {
		const res = await enviar("DELETE", org(`/proyectos/${proyecto}`), t.ana);
		expect(res.status).toBe(204);
		const tarea = await json(`/api/tareas/${tareaProyecto}`, t.beto);
		expect(tarea).toMatchObject({ organizacionId: acme, proyectoId: null });
		const deCaro = await json(`/api/notas/${nota}`, t.caro);
		expect(deCaro).toMatchObject({ organizacionId: null, proyectoId: null });
		expect((await api(`/api/notas/${nota}`, { token: t.ana })).status).toBe(
			404,
		);
	});

	it("al eliminar un equipo sus tareas pasan a la organización con sus responsables", async () => {
		const res = await enviar("DELETE", org(`/equipos/${plataforma}`), t.ana);
		expect(res.status).toBe(204);
		const tarea = await json(`/api/tareas/${tareaEquipo}`, t.caro);
		expect(tarea).toMatchObject({
			organizacionId: acme,
			equipoId: null,
			responsableIds: [id.beto],
		});
	});
});
