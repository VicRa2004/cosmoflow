import { beforeAll, describe, expect, it, spyOn } from "bun:test";
import type { Correo } from "@/core/shared/domain/Mailer";
import { container } from "@/core/shared/infrastructure/di/container";
import { TOKENS } from "@/core/shared/infrastructure/di/tokens";
import { app } from "@/core/shared/infrastructure/http/server";
import {
	api as apiBase,
	crearUsuario,
	login,
	vaciarUsuarios,
} from "@/test/e2e";

// IP propia: sus invitaciones no gastan el cupo de correos (por IP) de los demás e2e.
const api: typeof apiBase = (ruta, init = {}) =>
	apiBase(ruta, { ip: "10.99.0.1", ...init });

const correos: Correo[] = [];
spyOn(container.get(TOKENS.Mailer), "enviar").mockImplementation(
	async (correo) => {
		correos.push(correo);
	},
);

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);

function conArchivo(ruta: string, token: string, method = "POST") {
	const form = new FormData();
	form.append("archivo", new File([PNG], "a.png", { type: "image/png" }));
	return app.request(ruta, {
		method,
		headers: { Authorization: `Bearer ${token}` },
		body: form,
	});
}

type Peticion = [metodo: string, ruta: string, body?: unknown];

/**
 * Cierre de la Fase 2 (RN-90): desde otra organización no se ve ni se toca
 * nada de Acme. Ni con la URL de Acme, ni con los IDs de Acme bajo la propia
 * organización, ni metiéndolos en el cuerpo. El catálogo de permisos
 * (`/roles/catalogo`) queda fuera: es una constante igual para todas.
 */
describe("Aislamiento entre organizaciones (e2e)", () => {
	const t: Record<string, string> = {};
	const id: Record<string, number> = {};
	/** Recursos de Acme. */
	const a = {
		org: 0,
		rol: 0,
		tag: 0,
		equipo: 0,
		proyecto: 0,
		invitacion: 0,
		tareaEquipo: 0,
		tareaProyecto: 0,
		nota: 0,
		imagen: "",
	};
	let zeta: number;
	let tareaDeZoe: number;

	const json = async (
		metodo: string,
		ruta: string,
		token: string,
		body?: unknown,
	) => (await api(ruta, { method: metodo, token, body })).json();

	/** Lanza cada petición como zoe y devuelve `[metodo ruta, status]` para que el fallo diga cuál. */
	const comoZoe = async (peticiones: Peticion[]) => {
		const resultados: [string, number][] = [];
		for (const [metodo, ruta, body] of peticiones) {
			const res = await api(ruta, { method: metodo, token: t.zoe, body });
			resultados.push([`${metodo} ${ruta}`, res.status]);
		}
		return resultados;
	};
	const todos = (peticiones: Peticion[], status: number) =>
		peticiones.map(([metodo, ruta]): [string, number] => [
			`${metodo} ${ruta}`,
			status,
		]);

	beforeAll(async () => {
		await vaciarUsuarios();
		for (const quien of ["ana", "beto", "zoe"]) {
			await crearUsuario(`${quien}@aislorg.dev`, "USUARIO");
			t[quien] = await login(`${quien}@aislorg.dev`);
		}
		const color = "#6366f1";
		a.org = (
			await json("POST", "/api/organizaciones", t.ana, {
				nombre: "Acme",
				color,
			})
		).id;
		zeta = (
			await json("POST", "/api/organizaciones", t.zoe, {
				nombre: "Zeta",
				color,
			})
		).id;
		const acme = (ruta: string) => `/api/organizaciones/${a.org}${ruta}`;

		await api(acme("/invitaciones"), {
			method: "POST",
			token: t.ana,
			body: { email: "beto@aislorg.dev" },
		});
		await api("/api/invitaciones/aceptar", {
			method: "POST",
			token: t.beto,
			body: { token: correos.at(-1)?.texto.match(/token=([a-f0-9]{64})/)?.[1] },
		});
		for (const m of await json("GET", acme("/miembros"), t.ana)) {
			id[m.email.split("@")[0]] = m.usuarioId;
		}
		id.zoe = (
			await json("GET", `/api/organizaciones/${zeta}/miembros`, t.zoe)
		)[0].usuarioId;

		a.invitacion = (
			await json("POST", acme("/invitaciones"), t.ana, {
				email: "pendiente@aislorg.dev",
			})
		).id;
		a.rol = (
			await json("POST", acme("/roles"), t.ana, {
				nombre: "Lector",
				permisos: [],
			})
		).id;
		a.tag = (
			await json("POST", acme("/tags"), t.ana, { nombre: "interno" })
		).id;
		a.equipo = (
			await json("POST", acme("/equipos"), t.ana, {
				nombre: "Plataforma",
				color,
				miembroIds: [id.ana, id.beto],
				tagIds: [a.tag],
			})
		).id;
		a.proyecto = (
			await json("POST", acme("/proyectos"), t.ana, {
				nombre: "Lanzamiento",
				equipoIds: [a.equipo],
			})
		).id;
		a.tareaEquipo = (
			await json("POST", "/api/tareas", t.ana, {
				titulo: "De equipo",
				equipoId: a.equipo,
			})
		).id;
		a.tareaProyecto = (
			await json("POST", "/api/tareas", t.ana, {
				titulo: "De proyecto",
				proyectoId: a.proyecto,
			})
		).id;
		a.nota = (
			await json("POST", "/api/notas", t.ana, {
				titulo: "Acta",
				proyectoId: a.proyecto,
			})
		).id;
		a.imagen = (
			await (
				await conArchivo(`/api/adjuntos?proyectoId=${a.proyecto}`, t.ana)
			).json()
		).url;
		tareaDeZoe = (await json("POST", "/api/tareas", t.zoe, { titulo: "Mía" }))
			.id;
	});

	it("con la URL de Acme, cada endpoint de la organización responde 404", async () => {
		const o = `/api/organizaciones/${a.org}`;
		const peticiones: Peticion[] = [
			["GET", o],
			["PUT", o, { nombre: "Tomada" }],
			["DELETE", o],
			["GET", `${o}/avatar`],
			["DELETE", `${o}/avatar`],
			["GET", `${o}/miembros`],
			["DELETE", `${o}/miembros/${id.beto}`],
			["POST", `${o}/delegar`, { usuarioId: id.zoe }],
			["GET", `${o}/invitaciones`],
			["POST", `${o}/invitaciones`, { email: "intruso@aislorg.dev" }],
			["POST", `${o}/invitaciones/${a.invitacion}/reenviar`],
			["DELETE", `${o}/invitaciones/${a.invitacion}`],
			["GET", `${o}/roles`],
			["POST", `${o}/roles`, { nombre: "Intruso", permisos: [] }],
			["PUT", `${o}/roles/${a.rol}`, { nombre: "Intruso", permisos: [] }],
			["DELETE", `${o}/roles/${a.rol}`],
			["PUT", `${o}/miembros/${id.beto}/roles`, { rolIds: [a.rol] }],
			["GET", `${o}/tags`],
			["POST", `${o}/tags`, { nombre: "intruso" }],
			["GET", `${o}/tags/${a.tag}`],
			["PUT", `${o}/tags/${a.tag}`, { nombre: "intruso" }],
			["DELETE", `${o}/tags/${a.tag}`],
			["GET", `${o}/equipos`],
			[
				"POST",
				`${o}/equipos`,
				{ nombre: "X", color: "#6366f1", miembroIds: [id.ana, id.beto] },
			],
			["GET", `${o}/equipos/${a.equipo}`],
			["PUT", `${o}/equipos/${a.equipo}`, { nombre: "X" }],
			["PUT", `${o}/equipos/${a.equipo}/delegados`, { usuarioIds: [] }],
			["DELETE", `${o}/equipos/${a.equipo}`],
			["GET", `${o}/proyectos`],
			["POST", `${o}/proyectos`, { nombre: "X", equipoIds: [a.equipo] }],
			["GET", `${o}/proyectos/${a.proyecto}`],
			["PUT", `${o}/proyectos/${a.proyecto}`, { nombre: "X" }],
			["DELETE", `${o}/proyectos/${a.proyecto}`],
		];
		expect(await comoZoe(peticiones)).toEqual(todos(peticiones, 404));
		expect((await conArchivo(`${o}/avatar`, t.zoe, "PUT")).status).toBe(404);
	});

	it("con su propia organización y los IDs de Acme, también 404", async () => {
		const z = `/api/organizaciones/${zeta}`;
		const peticiones: Peticion[] = [
			["DELETE", `${z}/miembros/${id.beto}`],
			["POST", `${z}/delegar`, { usuarioId: id.beto }],
			["PUT", `${z}/miembros/${id.beto}/roles`, { rolIds: [] }],
			["PUT", `${z}/miembros/${id.zoe}/roles`, { rolIds: [a.rol] }],
			["POST", `${z}/invitaciones/${a.invitacion}/reenviar`],
			["DELETE", `${z}/invitaciones/${a.invitacion}`],
			["PUT", `${z}/roles/${a.rol}`, { nombre: "Intruso", permisos: [] }],
			["DELETE", `${z}/roles/${a.rol}`],
			["GET", `${z}/tags/${a.tag}`],
			["PUT", `${z}/tags/${a.tag}`, { nombre: "intruso" }],
			["DELETE", `${z}/tags/${a.tag}`],
			["GET", `${z}/equipos/${a.equipo}`],
			["PUT", `${z}/equipos/${a.equipo}`, { nombre: "X" }],
			["PUT", `${z}/equipos/${a.equipo}/delegados`, { usuarioIds: [] }],
			["DELETE", `${z}/equipos/${a.equipo}`],
			["GET", `${z}/proyectos/${a.proyecto}`],
			["PUT", `${z}/proyectos/${a.proyecto}`, { nombre: "X" }],
			["DELETE", `${z}/proyectos/${a.proyecto}`],
		];
		expect(await comoZoe(peticiones)).toEqual(todos(peticiones, 404));
	});

	it("los IDs de Acme en el cuerpo, bajo su propia organización, se rechazan (400)", async () => {
		const z = `/api/organizaciones/${zeta}`;
		const peticiones: Peticion[] = [
			// beto no es de Zeta; el tag y el equipo son de Acme.
			[
				"POST",
				`${z}/equipos`,
				{ nombre: "X", color: "#6366f1", miembroIds: [id.zoe, id.beto] },
			],
			["POST", `${z}/proyectos`, { nombre: "X", equipoIds: [a.equipo] }],
			["POST", "/api/tareas", { titulo: "x", tagIds: [a.tag] }],
			["POST", "/api/notas", { titulo: "x", tagIds: [a.tag] }],
		];
		expect(await comoZoe(peticiones)).toEqual(todos(peticiones, 400));
	});

	it("las tareas, notas e imágenes de equipos y proyectos de Acme responden 404", async () => {
		const peticiones: Peticion[] = [
			["GET", `/api/tareas?equipoId=${a.equipo}`],
			["GET", `/api/tareas?proyectoId=${a.proyecto}`],
			["POST", "/api/tareas", { titulo: "x", equipoId: a.equipo }],
			["POST", "/api/tareas", { titulo: "x", proyectoId: a.proyecto }],
			["POST", `/api/tareas/${tareaDeZoe}/mover`, { equipoId: a.equipo }],
			["POST", `/api/tareas/${tareaDeZoe}/mover`, { proyectoId: a.proyecto }],
			["GET", `/api/notas?proyectoId=${a.proyecto}`],
			["POST", "/api/notas", { titulo: "x", proyectoId: a.proyecto }],
			["GET", a.imagen],
		];
		for (const tarea of [a.tareaEquipo, a.tareaProyecto]) {
			peticiones.push(
				["GET", `/api/tareas/${tarea}`],
				["PUT", `/api/tareas/${tarea}`, { titulo: "mía" }],
				["DELETE", `/api/tareas/${tarea}`],
				["POST", `/api/tareas/${tarea}/mover`, { proyectoId: a.proyecto }],
			);
		}
		peticiones.push(
			["GET", `/api/notas/${a.nota}`],
			["PUT", `/api/notas/${a.nota}`, { titulo: "mía" }],
			["DELETE", `/api/notas/${a.nota}`],
		);
		expect(await comoZoe(peticiones)).toEqual(todos(peticiones, 404));
		for (const query of [
			`?equipoId=${a.equipo}`,
			`?proyectoId=${a.proyecto}`,
		]) {
			expect([
				query,
				(await conArchivo(`/api/adjuntos${query}`, t.zoe)).status,
			]).toEqual([query, 404]);
		}
	});

	it("sus listados no muestran nada de Acme", async () => {
		const deZeta = await json("GET", "/api/organizaciones", t.zoe);
		expect(deZeta.datos.map((o: { id: number }) => o.id)).toEqual([zeta]);
		const pendientes = await json("GET", "/api/tareas/pendientes", t.zoe);
		expect(pendientes.datos.map((d: { id: number }) => d.id)).not.toContain(
			a.tareaEquipo,
		);
		const tareas = await json("GET", "/api/tareas?busqueda=De", t.zoe);
		expect(tareas.totalElementos).toBe(0);
		const notas = await json("GET", "/api/notas?busqueda=Acta", t.zoe);
		expect(notas.totalElementos).toBe(0);
	});

	it("tras los intentos, lo de Acme sigue intacto", async () => {
		const o = `/api/organizaciones/${a.org}`;
		expect(await json("GET", o, t.ana)).toMatchObject({ nombre: "Acme" });
		expect((await json("GET", `${o}/miembros`, t.ana)).length).toBe(2);
		expect((await json("GET", `${o}/invitaciones`, t.ana)).length).toBe(1);
		expect(await json("GET", `${o}/tags/${a.tag}`, t.ana)).toMatchObject({
			nombre: "interno",
		});
		expect(await json("GET", `${o}/equipos/${a.equipo}`, t.ana)).toMatchObject({
			nombre: "Plataforma",
		});
		expect(
			await json("GET", `${o}/proyectos/${a.proyecto}`, t.ana),
		).toMatchObject({
			nombre: "Lanzamiento",
		});
		expect(
			await json("GET", `/api/tareas/${a.tareaEquipo}`, t.beto),
		).toMatchObject({
			titulo: "De equipo",
		});
		expect(await json("GET", `/api/notas/${a.nota}`, t.beto)).toMatchObject({
			titulo: "Acta",
		});
		expect((await api(a.imagen, { token: t.beto })).status).toBe(200);
		const roles = await json("GET", `${o}/roles`, t.ana);
		expect(roles.map((r: { id: number }) => r.id)).toContain(a.rol);
	});
});
