import { beforeAll, describe, expect, it, spyOn } from "bun:test";
import type { Correo } from "@/core/shared/domain/Mailer";
import { container } from "@/core/shared/infrastructure/di/container";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { prisma } from "@/core/config/prisma";
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

	it("estadísticas del equipo: solo para sus miembros", async () => {
		const res = await api(`/api/tareas/estadisticas?equipoId=${equipo}`, {
			token: t.caro,
		});
		expect(res.status).toBe(200);
		expect(await res.json()).toMatchObject({
			total: 1,
			porEstado: { en_progreso: 1, pendiente: 0 },
			abiertasPorPrioridad: { media: 1 },
			vencidas: 0,
			porResponsable: [{ usuarioId: id.caro, abiertas: 1, completadas: 0 }],
		});
		expect(
			(
				await api(`/api/tareas/estadisticas?equipoId=${equipo}`, {
					token: t.zoe,
				})
			).status,
		).toBe(404);
		expect(
			(await api("/api/tareas/estadisticas", { token: t.caro })).status,
		).toBe(400);
	});

	it("asignadas incluye lo asignado en cualquier contexto y nada ajeno", async () => {
		const ids = async (token: string) =>
			(
				await (await api("/api/tareas?asignadas=true", { token })).json()
			).datos.map((d: { id: number }) => d.id);
		expect(await ids(t.caro)).toContain(tareaEquipo);
		expect(await ids(t.zoe)).not.toContain(tareaEquipo);
		expect(
			(
				await api(`/api/tareas?asignadas=true&equipoId=${equipo}`, {
					token: t.caro,
				})
			).status,
		).toBe(400);
	});

	it("responsableId filtra por responsable dentro del contexto", async () => {
		const ids = async (responsableId: number, extra = `equipoId=${equipo}`) =>
			(
				await (
					await api(`/api/tareas?${extra}&responsableId=${responsableId}`, {
						token: t.beto,
					})
				).json()
			).datos.map((d: { id: number }) => d.id);
		expect(await ids(id.caro)).toEqual([tareaEquipo]);
		expect(await ids(id.ana)).toEqual([]);
		// Combinado con un ámbito que ya filtra por responsables.
		expect(await ids(id.caro, "asignadasPorMi=true")).toContain(tareaEquipo);
		expect(await ids(id.ana, "asignadasPorMi=true")).toEqual([]);
	});

	it("papelera del equipo: la ven sus miembros y solo quien puede crear la restaura", async () => {
		const id = (
			await (
				await post("/api/tareas", t.beto, {
					titulo: "Borrable",
					equipoId: equipo,
				})
			).json()
		).id;
		await api(`/api/tareas/${id}`, { method: "DELETE", token: t.beto });

		const enPapelera = async (token: string) =>
			(await (await api("/api/tareas/papelera", { token })).json()).datos.map(
				(d: { id: number }) => d.id,
			);
		expect(await enPapelera(t.caro)).toContain(id);
		expect(await enPapelera(t.zoe)).not.toContain(id);

		const restaurar = (token: string) =>
			api(`/api/tareas/papelera/${id}/restaurar`, { method: "POST", token });
		expect((await restaurar(t.caro)).status).toBe(403);
		expect((await restaurar(t.zoe)).status).toBe(404);
		expect((await restaurar(t.beto)).status).toBe(204);
	});

	it("comentarios: los ven los miembros; edita su autor y modera quien gestiona", async () => {
		const ruta = `/api/tareas/${tareaEquipo}/comentarios`;
		const crear = await post(ruta, t.caro, { contenido: "  Empiezo yo  " });
		expect(crear.status).toBe(201);
		const comentario = await crear.json();
		expect(comentario).toMatchObject({
			autorId: id.caro,
			autorNombre: expect.any(String),
			contenido: "Empiezo yo",
			editadoEn: null,
		});
		await post(ruta, t.ana, { contenido: "Y yo después" });

		const lista = await (await api(ruta, { token: t.ana })).json();
		expect(lista.datos.map((c: { contenido: string }) => c.contenido)).toEqual([
			"Empiezo yo",
			"Y yo después",
		]);
		expect((await api(ruta, { token: t.zoe })).status).toBe(404);
		expect((await post(ruta, t.caro, { contenido: "   " })).status).toBe(400);

		const deCaro = `${ruta}/${comentario.id}`;
		expect(
			(await put(deCaro, t.ana, { contenido: "Cambiado por otra" })).status,
		).toBe(403);
		const editado = await put(deCaro, t.caro, { contenido: "Empiezo yo (v2)" });
		expect(await editado.json()).toMatchObject({
			contenido: "Empiezo yo (v2)",
			editadoEn: expect.any(String),
		});

		// ana es miembro sin ser líder ni delegada: no modera; beto (líder) sí.
		expect((await api(deCaro, { method: "DELETE", token: t.ana })).status).toBe(
			403,
		);
		expect(
			(await api(deCaro, { method: "DELETE", token: t.beto })).status,
		).toBe(204);
		expect(
			(await api(deCaro, { method: "DELETE", token: t.beto })).status,
		).toBe(404);
	});

	it("historial: quién creó, cambió, comentó y mandó a la papelera, lo último primero", async () => {
		// Otros e2e dejan auditoría de tareas con ids que el TRUNCATE reutiliza.
		await despacharEventos();
		await prisma.auditoria.deleteMany({
			where: { evento: { startsWith: "tarea." } },
		});
		const tarea = await (
			await post("/api/tareas", t.beto, {
				titulo: "Con historia",
				equipoId: equipo,
				responsableIds: [id.caro],
			})
		).json();
		await put(`/api/tareas/${tarea.id}`, t.beto, {
			titulo: "Con más historia",
			estado: "en_progreso",
		});
		await post(`/api/tareas/${tarea.id}/comentarios`, t.caro, {
			contenido: "Voy",
		});
		await api(`/api/tareas/${tarea.id}`, { method: "DELETE", token: t.beto });
		await api(`/api/tareas/papelera/${tarea.id}/restaurar`, {
			method: "POST",
			token: t.beto,
		});
		await despacharEventos();

		const ruta = `/api/tareas/${tarea.id}/actividad`;
		const res = await api(ruta, { token: t.caro });
		expect(res.status).toBe(200);
		const historial = await res.json();
		expect(
			historial.datos.map((e: { evento: string }) => e.evento).sort(),
		).toEqual(
			[
				"tarea.comentada",
				"tarea.creada",
				"tarea.actualizada",
				"tarea.eliminada",
				"tarea.estadoCambiado",
				"tarea.responsablesAsignados",
				"tarea.restaurada",
			].sort(),
		);
		expect(historial.datos[0]).toMatchObject({
			evento: "tarea.restaurada",
			actorId: id.beto,
		});
		expect(
			historial.datos.find(
				(e: { evento: string }) => e.evento === "tarea.actualizada",
			).datos.cambios,
		).toEqual({
			titulo: { anterior: "Con historia", nuevo: "Con más historia" },
		});
		expect(Object.keys(historial.nombres).map(Number).sort()).toEqual(
			[id.beto, id.caro].sort(),
		);

		const primera = await (
			await api(`${ruta}?limite=2`, { token: t.caro })
		).json();
		const resto = await (
			await api(`${ruta}?antesDe=${primera.datos[1].id}&limite=50`, {
				token: t.caro,
			})
		).json();
		expect(primera.hayMas).toBe(true);
		expect(resto).toMatchObject({ hayMas: false });
		expect(resto.datos).toHaveLength(5);
		expect((await api(ruta, { token: t.zoe })).status).toBe(404);
	});

	it("asignadasPorMi da las que asignó a otros y guarda quién asignó", async () => {
		const res = await api("/api/tareas?asignadasPorMi=true", { token: t.beto });
		const { datos } = await res.json();
		expect(datos.map((d: { id: number }) => d.id)).toContain(tareaEquipo);
		expect(
			datos.find((d: { id: number }) => d.id === tareaEquipo).asignadoPor,
		).toEqual({ [id.caro]: id.beto });
		const deCaro = await (
			await api("/api/tareas?asignadasPorMi=true", { token: t.caro })
		).json();
		expect(deCaro.datos.map((d: { id: number }) => d.id)).not.toContain(
			tareaEquipo,
		);
		expect(
			(
				await api("/api/tareas?asignadasPorMi=true&asignadas=true", {
					token: t.beto,
				})
			).status,
		).toBe(400);
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

	it("en la organización, sin equipo ni proyecto, crea cualquier miembro y solo ellos la ven", async () => {
		const crear = await post("/api/tareas", t.caro, {
			titulo: "Renovar dominio",
			organizacionId: acme,
			responsableIds: [id.beto],
		});
		expect(crear.status).toBe(201);
		const tarea = await crear.json();
		expect(tarea).toMatchObject({
			organizacionId: acme,
			equipoId: null,
			proyectoId: null,
		});

		// Solo las de la organización: las de sus equipos y proyectos van aparte.
		const lista = await (
			await api(`/api/tareas?organizacionId=${acme}`, { token: t.ana })
		).json();
		expect(lista.datos.map((d: { id: number }) => d.id)).toEqual([tarea.id]);

		expect(
			(await api(`/api/tareas?organizacionId=${acme}`, { token: t.zoe }))
				.status,
		).toBe(404);
		expect(
			(await api(`/api/tareas/${tarea.id}`, { token: t.zoe })).status,
		).toBe(404);
	});

	it("el calendario junta personales y compartidas visibles, por vencimiento o inicio", async () => {
		const crear = (token: string, body: Record<string, unknown>) =>
			post("/api/tareas", token, body);
		await crear(t.ana, {
			titulo: "Cal personal",
			fechaVencimiento: "2031-03-10",
		});
		await crear(t.beto, {
			titulo: "Cal de beto",
			fechaVencimiento: "2031-03-11",
		});
		await crear(t.beto, {
			titulo: "Cal equipo",
			equipoId: equipo,
			fechaVencimiento: "2031-03-15",
		});
		await crear(t.caro, {
			titulo: "Cal proyecto",
			proyectoId: proyecto,
			fechaInicio: "2031-03-20",
			fechaVencimiento: null,
		});
		await crear(t.caro, {
			titulo: "Cal organización",
			organizacionId: acme,
			fechaVencimiento: "2031-03-25",
		});
		await crear(t.ana, { titulo: "Cal fuera", fechaVencimiento: "2031-04-01" });

		const calendario = async (token: string) =>
			(
				(await (
					await api(
						"/api/tareas/calendario?desde=2031-03-01&hasta=2031-03-31",
						{
							token,
						},
					)
				).json()) as { titulo: string }[]
			).map((tarea) => tarea.titulo);

		expect(await calendario(t.ana)).toEqual([
			"Cal personal",
			"Cal equipo",
			"Cal organización",
			"Cal proyecto",
		]);
		expect(await calendario(t.zoe)).toEqual([]);
		expect(
			(await api("/api/tareas/calendario?desde=2031-03-01", { token: t.ana }))
				.status,
		).toBe(400);
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
