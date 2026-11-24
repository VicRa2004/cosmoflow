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

interface Resultados {
	tareas: { titulo: string }[];
	notas: { titulo: string }[];
	proyectos: { nombre: string }[];
	equipos: { nombre: string }[];
}

describe("Búsqueda global (e2e)", () => {
	const t: Record<string, string> = {};
	const id: Record<string, number> = {};
	let acme: number;
	const org = (ruta: string) => `/api/organizaciones/${acme}${ruta}`;
	const post = async (ruta: string, token: string, body: unknown) => {
		const res = await api(ruta, { method: "POST", token, body });
		expect(res.status).toBe(201);
		return (await res.json()).id as number;
	};
	/** Títulos y nombres encontrados por tipo, ordenados para comparar. */
	const buscar = async (quien: string, q = "alfa") => {
		const res = await api(`/api/busqueda?q=${encodeURIComponent(q)}`, {
			token: t[quien],
		});
		expect(res.status).toBe(200);
		const r: Resultados = await res.json();
		return {
			tareas: r.tareas.map((x) => x.titulo).sort(),
			notas: r.notas.map((x) => x.titulo).sort(),
			proyectos: r.proyectos.map((x) => x.nombre).sort(),
			equipos: r.equipos.map((x) => x.nombre).sort(),
		};
	};

	beforeAll(async () => {
		await vaciarUsuarios();
		for (const quien of ["ana", "beto", "caro", "zoe"]) {
			await crearUsuario(`${quien}@busqueda.dev`, "USUARIO");
			t[quien] = await login(`${quien}@busqueda.dev`);
		}
		// ana crea Acme (admin); beto y caro entran; zoe es ajena.
		acme = await post("/api/organizaciones", t.ana, {
			nombre: "Acme",
			color: "#6366f1",
		});
		for (const quien of ["beto", "caro"]) {
			await api(org("/invitaciones"), {
				method: "POST",
				token: t.ana,
				body: { email: `${quien}@busqueda.dev` },
				// IP propia: el límite de invitaciones se comparte con los demás e2e.
				ip: "10.52.0.1",
			});
			await api("/api/invitaciones/aceptar", {
				method: "POST",
				token: t[quien],
				ip: "10.52.0.1",
				body: {
					token: correos.at(-1)?.texto.match(/token=([a-f0-9]{64})/)?.[1],
				},
			});
		}
		const miembros = await (
			await api(org("/miembros"), { token: t.ana })
		).json();
		for (const m of miembros as { email: string; usuarioId: number }[]) {
			id[m.email.split("@")[0]] = m.usuarioId;
		}
		const plataforma = await post(org("/equipos"), t.ana, {
			nombre: "Plataforma Alfa",
			color: "#6366f1",
			miembroIds: [id.ana, id.beto],
		});
		const ventas = await post(org("/equipos"), t.ana, {
			nombre: "Ventas Alfa",
			color: "#6366f1",
			liderId: id.caro,
			miembroIds: [id.beto, id.caro],
		});
		const proyecto = await post(org("/proyectos"), t.ana, {
			nombre: "Lanzamiento Alfa",
			equipoIds: [plataforma],
		});

		await post("/api/tareas", t.zoe, { titulo: "Alfa de zoe" });
		await post("/api/tareas", t.caro, { titulo: "Alfa personal de caro" });
		await post("/api/tareas", t.ana, {
			titulo: "Alfa de la organización",
			organizacionId: acme,
		});
		await post("/api/tareas", t.caro, {
			titulo: "Alfa de ventas",
			equipoId: ventas,
		});
		await post("/api/tareas", t.beto, {
			titulo: "Del proyecto",
			contenido: "Detalles de la fase ALFA",
			proyectoId: proyecto,
		});
		const borrada = await post("/api/tareas", t.beto, {
			titulo: "Alfa borrada",
		});
		await api(`/api/tareas/${borrada}`, { method: "DELETE", token: t.beto });

		await post("/api/notas", t.zoe, { titulo: "Nota alfa de zoe" });
		await post("/api/notas", t.beto, {
			titulo: "Acta",
			contenido: "Se aprueba la fase alfa",
			proyectoId: proyecto,
		});
		const notaBorrada = await post("/api/notas", t.caro, {
			titulo: "Nota alfa borrada",
		});
		await api(`/api/notas/${notaBorrada}`, {
			method: "DELETE",
			token: t.caro,
		});
	});

	it("miembro de equipo y proyecto: lo suyo, sin distinguir mayúsculas y por contenido", async () => {
		expect(await buscar("beto", "ALFA")).toEqual({
			tareas: ["Alfa de la organización", "Alfa de ventas", "Del proyecto"],
			notas: ["Acta"],
			proyectos: ["Lanzamiento Alfa"],
			equipos: ["Plataforma Alfa", "Ventas Alfa"],
		});
	});

	it("miembro sin el proyecto: no ve sus tareas, notas, ni el proyecto ni equipos ajenos", async () => {
		expect(await buscar("caro")).toEqual({
			tareas: [
				"Alfa de la organización",
				"Alfa de ventas",
				"Alfa personal de caro",
			],
			notas: [],
			proyectos: [],
			equipos: ["Ventas Alfa"],
		});
	});

	it("admin: todos los proyectos y equipos, pero las tareas solo donde es miembro (como los listados)", async () => {
		expect(await buscar("ana")).toEqual({
			tareas: ["Alfa de la organización", "Del proyecto"],
			notas: ["Acta"],
			proyectos: ["Lanzamiento Alfa"],
			equipos: ["Plataforma Alfa", "Ventas Alfa"],
		});
	});

	it("ajeno a la organización: solo lo personal suyo", async () => {
		expect(await buscar("zoe")).toEqual({
			tareas: ["Alfa de zoe"],
			notas: ["Nota alfa de zoe"],
			proyectos: [],
			equipos: [],
		});
	});

	it("exige sesión y al menos 2 caracteres", async () => {
		expect((await api("/api/busqueda?q=alfa", {})).status).toBe(401);
		expect(
			(await api("/api/busqueda?q=%20a%20", { token: t.ana })).status,
		).toBe(400);
	});
});
