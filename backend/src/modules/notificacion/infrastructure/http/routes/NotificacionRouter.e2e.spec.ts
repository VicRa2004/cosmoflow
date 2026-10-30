import { beforeAll, describe, expect, it, spyOn } from "bun:test";
import { prisma } from "@/core/config/prisma";
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
const paraBuscar = (email: string, asunto: string) =>
	correos.filter((c) => c.para === email && c.asunto.includes(asunto));

describe("Notificaciones (e2e)", () => {
	const t: Record<string, string> = {};
	let betoId: number;
	let tareaId: number;
	let acme: number;
	const preferencias = "/api/notificaciones/preferencias";

	beforeAll(async () => {
		await vaciarUsuarios();
		// Eventos de otros e2e: sus ids de tarea se reutilizan tras el TRUNCATE.
		await prisma.eventoOutbox.deleteMany();
		await prisma.notificacionEnviada.deleteMany();
		for (const quien of ["ana", "beto", "zoe"]) {
			await crearUsuario(`${quien}@avisos.dev`, "USUARIO");
			t[quien] = await login(`${quien}@avisos.dev`);
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
			body: { email: "beto@avisos.dev" },
		});
		await api("/api/invitaciones/aceptar", {
			method: "POST",
			token: t.beto,
			body: { token: correos.at(-1)?.texto.match(/token=([a-f0-9]{64})/)?.[1] },
		});
		betoId = (
			await prisma.usuario.findUniqueOrThrow({
				where: { email: "beto@avisos.dev" },
			})
		).id;
		tareaId = (
			await (
				await api("/api/tareas", {
					method: "POST",
					token: t.ana,
					body: {
						titulo: "Preparar demo",
						organizacionId: acme,
						responsableIds: [betoId],
					},
				})
			).json()
		).id;
		await despacharEventos();
	});

	it("avisa por correo al responsable asignado, con enlace a la tarea", () => {
		const [correo] = paraBuscar("beto@avisos.dev", "Te asignaron");
		expect(correo?.asunto).toBe("Te asignaron «Preparar demo»");
		expect(correo?.texto).toContain(`/tareas/${tareaId}`);
		expect(paraBuscar("ana@avisos.dev", "Te asignaron")).toEqual([]);
	});

	it("avisa a quien la creó del cambio de estado, salvo si lo desactivó", async () => {
		const cambiar = (estado: string) =>
			api(`/api/tareas/${tareaId}`, {
				method: "PUT",
				token: t.beto,
				body: { estado },
			});

		await cambiar("en_progreso");
		await despacharEventos();
		expect(paraBuscar("ana@avisos.dev", "pasó a")).toHaveLength(1);

		await api(preferencias, {
			method: "PUT",
			token: t.ana,
			body: [{ evento: "estadoCambiado", canal: "correo", activo: false }],
		});
		await cambiar("completada");
		await despacharEventos();
		expect(paraBuscar("ana@avisos.dev", "pasó a")).toHaveLength(1);
	});

	it("cada usuario ve sus preferencias con los valores por defecto", async () => {
		const res = await api(preferencias, { token: t.beto });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([
			{
				evento: "tareaAsignada",
				canal: "correo",
				activo: true,
				personalizado: false,
			},
			{
				evento: "estadoCambiado",
				canal: "correo",
				activo: true,
				personalizado: false,
			},
		]);
	});

	it("rechaza eventos o canales desconocidos y exige sesión", async () => {
		const res = await api(preferencias, {
			method: "PUT",
			token: t.ana,
			body: [{ evento: "otro", canal: "correo", activo: true }],
		});
		expect(res.status).toBe(400);
		expect((await api(preferencias)).status).toBe(401);
	});

	it("la organización pone valores por defecto; la elección del miembro gana (RN-92)", async () => {
		const deOrg = `/api/organizaciones/${acme}/notificaciones`;
		const apagar = [
			{ evento: "tareaAsignada", canal: "correo", activo: false },
		];
		const asignar = async (titulo: string) => {
			await api("/api/tareas", {
				method: "POST",
				token: t.ana,
				body: { titulo, organizacionId: acme, responsableIds: [betoId] },
			});
			await despacharEventos();
			return paraBuscar("beto@avisos.dev", titulo);
		};

		const sinPermiso = await api(deOrg, {
			method: "PUT",
			token: t.beto,
			body: apagar,
		});
		expect(sinPermiso.status).toBe(403);
		expect((await api(deOrg, { token: t.zoe })).status).toBe(404);

		const res = await api(deOrg, { method: "PUT", token: t.ana, body: apagar });
		expect(res.status).toBe(200);
		expect(await asignar("Silenciada")).toEqual([]);

		await api(preferencias, {
			method: "PUT",
			token: t.beto,
			body: [{ evento: "tareaAsignada", canal: "correo", activo: true }],
		});
		expect(await asignar("La quiero")).toHaveLength(1);
	});
});
