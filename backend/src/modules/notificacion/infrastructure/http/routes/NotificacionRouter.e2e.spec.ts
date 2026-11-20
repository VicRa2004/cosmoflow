import { beforeAll, describe, expect, it, spyOn } from "bun:test";
import { env } from "@/core/config/env";
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
		expect(await res.json()).toEqual(
			[
				"tareaAsignada",
				"mencion",
				"estadoCambiado",
				"vencimiento",
				"comentario",
			].flatMap((evento) => [
				{ evento, canal: "correo", activo: true, personalizado: false },
				{ evento, canal: "telegram", activo: false, personalizado: false },
				{ evento, canal: "movil", activo: false, personalizado: false },
			]),
		);
	});

	it.skipIf(Boolean(env.TELEGRAM_BOT_TOKEN))(
		"sin TELEGRAM_BOT_TOKEN, Telegram no está disponible",
		async () => {
			expect(
				await (
					await api("/api/notificaciones/telegram", { token: t.ana })
				).json(),
			).toEqual({ disponible: false, vinculado: false });
			const vincular = await api("/api/notificaciones/telegram/vincular", {
				method: "POST",
				token: t.ana,
			});
			expect(vincular.status).toBe(503);
		},
	);

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

	it("avisa a los mencionados nuevos con acceso, una sola vez", async () => {
		const zoeId = (
			await prisma.usuario.findUniqueOrThrow({
				where: { email: "zoe@avisos.dev" },
			})
		).id;
		const contenido = `Revisa esto [@Beto](mencion:${betoId}) y [@Zoe](mencion:${zoeId})`;
		const { id } = await (
			await api("/api/tareas", {
				method: "POST",
				token: t.ana,
				body: { titulo: "Con mención", organizacionId: acme, contenido },
			})
		).json();
		await api(`/api/tareas/${id}`, {
			method: "PUT",
			token: t.ana,
			body: { contenido: `${contenido}\n\nOtra línea` },
		});
		await despacharEventos();

		// zoe no es miembro de la organización: su mención se descarta.
		expect(
			await prisma.tareaMencion.findMany({ where: { tareaId: id } }),
		).toEqual([{ tareaId: id, usuarioId: betoId }]);
		expect(paraBuscar("beto@avisos.dev", "Te mencionaron")).toHaveLength(1);
		expect(paraBuscar("zoe@avisos.dev", "Te mencionaron")).toEqual([]);
	});

	it("un comentario avisa a los mencionados y al creador, nunca al autor", async () => {
		const anaId = (
			await prisma.usuario.findUniqueOrThrow({
				where: { email: "ana@avisos.dev" },
			})
		).id;
		const { id } = await (
			await api("/api/tareas", {
				method: "POST",
				token: t.ana,
				body: { titulo: "Para comentar", organizacionId: acme },
			})
		).json();
		const comentar = (token: string, contenido: string) =>
			api(`/api/tareas/${id}/comentarios`, {
				method: "POST",
				token,
				body: { contenido },
			});

		expect(
			(await comentar(t.ana, `Mira [@Beto](mencion:${betoId})`)).status,
		).toBe(201);
		expect(
			(await comentar(t.beto, `Visto [@Ana](mencion:${anaId})`)).status,
		).toBe(201);
		await comentar(t.beto, "Y otra cosa");
		await despacharEventos();

		expect(
			paraBuscar("beto@avisos.dev", "Te mencionaron en un comentario"),
		).toHaveLength(1);
		expect(paraBuscar("beto@avisos.dev", "Nuevo comentario")).toEqual([]);
		// Ana es la creadora: la mención le llega como mención, el resto como comentario.
		expect(
			paraBuscar("ana@avisos.dev", "Te mencionaron en un comentario"),
		).toHaveLength(1);
		expect(paraBuscar("ana@avisos.dev", "Nuevo comentario")).toHaveLength(1);
	});

	it("registra, reasigna y da de baja dispositivos push", async () => {
		const tokenPush = "fcm_token_dispositivo_de_prueba_123456";
		const dispositivos = "/api/notificaciones/dispositivos";

		const altaAna = await api(dispositivos, {
			method: "POST",
			token: t.ana,
			body: { token: tokenPush, plataforma: "android" },
		});
		expect(altaAna.status).toBe(204);
		expect(
			await prisma.dispositivoPush.findUnique({ where: { token: tokenPush } }),
		).toMatchObject({ plataforma: "android" });

		// Si otro usuario inicia sesión en el mismo teléfono, el token se reasigna.
		const altaBeto = await api(dispositivos, {
			method: "POST",
			token: t.beto,
			body: { token: tokenPush, plataforma: "android" },
		});
		expect(altaBeto.status).toBe(204);
		expect(
			await prisma.dispositivoPush.findUnique({ where: { token: tokenPush } }),
		).toMatchObject({ usuarioId: betoId });

		// Ana ya no puede borrar el token que ahora pertenece a Beto.
		const bajaAjena = await api(dispositivos, {
			method: "DELETE",
			token: t.ana,
			body: { token: tokenPush },
		});
		expect(bajaAjena.status).toBe(204);
		expect(
			await prisma.dispositivoPush.findUnique({ where: { token: tokenPush } }),
		).not.toBeNull();

		// Beto sí da de baja su dispositivo.
		const bajaBeto = await api(dispositivos, {
			method: "DELETE",
			token: t.beto,
			body: { token: tokenPush },
		});
		expect(bajaBeto.status).toBe(204);
		expect(
			await prisma.dispositivoPush.findUnique({ where: { token: tokenPush } }),
		).toBeNull();

		// Valida payload.
		const invalido = await api(dispositivos, {
			method: "POST",
			token: t.ana,
			body: { token: "corto", plataforma: "windows" },
		});
		expect(invalido.status).toBe(400);
	});

	it.skipIf(
		Boolean(env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY),
	)("sin credenciales FCM, el canal móvil no está disponible", async () => {
		const res = await api("/api/notificaciones/movil", { token: t.ana });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ disponible: false, dispositivos: 0 });
	});
});
