import { beforeAll, describe, expect, it } from "bun:test";
import { prisma } from "@/core/config/prisma";
import { api, crearUsuario, login, vaciarUsuarios } from "@/test/e2e";
import { PrismaNotificacionRepository } from "./PrismaNotificacionRepository";

describe("PrismaNotificacionRepository (e2e)", () => {
	let usuarioId: number;

	beforeAll(async () => {
		await vaciarUsuarios();
		usuarioId = (await crearUsuario("ana@vence.dev")).id;
		const crear = (titulo: string, datos: object) =>
			prisma.tarea.create({ data: { usuarioId, titulo, ...datos } });
		await crear("Vence hoy", { fechaVencimiento: new Date("2026-10-30") });
		await crear("En progreso", {
			fechaVencimiento: new Date("2026-10-31"),
			estado: "en_progreso",
		});
		await crear("Completada", {
			fechaVencimiento: new Date("2026-10-30"),
			estado: "completada",
		});
		await crear("Borrada", {
			fechaVencimiento: new Date("2026-10-30"),
			deletedAt: new Date(),
		});
		await crear("Otro día", { fechaVencimiento: new Date("2026-11-05") });
		await crear("Sin fecha", {});
	});

	it("solo las pendientes o en progreso, sin borrar, que vencen esos días", async () => {
		const tareas = await new PrismaNotificacionRepository().tareasPorVencer([
			"2026-10-30",
			"2026-10-31",
		]);

		expect(tareas.map((t) => [t.titulo, t.fechaVencimiento]).sort()).toEqual([
			["En progreso", "2026-10-31"],
			["Vence hoy", "2026-10-30"],
		]);
		expect(tareas[0]).toMatchObject({ usuarioId, responsableIds: [] });
	});
});

// Después del describe anterior (que vacía usuarios): emails propios.
describe("Resumen diario en PrismaNotificacionRepository (e2e)", () => {
	const repo = new PrismaNotificacionRepository();
	let lia: { id: number };
	let otro: { id: number };

	beforeAll(async () => {
		lia = await crearUsuario("lia@resumen.dev", "USUARIO");
		otro = await crearUsuario("otro@resumen.dev", "USUARIO");
		const token = await login("lia@resumen.dev");
		const tokenOtro = await login("otro@resumen.dev");
		const crear = (t: string, body: Record<string, unknown>) =>
			api("/api/tareas", { method: "POST", token: t, body });

		await crear(token, { titulo: "Atrasada", fechaVencimiento: "2026-10-28" });
		await crear(token, { titulo: "Vence hoy", fechaVencimiento: "2026-10-30" });
		await crear(token, { titulo: "Empieza hoy", fechaInicio: "2026-10-30" });
		await crear(token, { titulo: "Mañana", fechaVencimiento: "2026-10-31" });
		await crear(token, { titulo: "Sin fecha" });
		await crear(token, {
			titulo: "Hecha",
			estado: "completada",
			fechaVencimiento: "2026-10-30",
		});
		await crear(tokenOtro, {
			titulo: "De otro",
			fechaVencimiento: "2026-10-30",
		});

		await api("/api/notificaciones/preferencias", {
			method: "PUT",
			token,
			body: [{ evento: "resumenDiario", canal: "correo", activo: true }],
		});
	});

	it("solo devuelve a quien activó el resumen", async () => {
		const ids = await repo.usuariosConResumenDiario();
		expect(ids).toContain(lia.id);
		expect(ids).not.toContain(otro.id);
	});

	it("devuelve lo atrasado, lo que vence y lo que empieza hoy, sin completadas ni ajenas", async () => {
		const tareas = await repo.tareasDelDia(lia.id, "2026-10-30");
		expect(tareas.map((t) => t.titulo)).toEqual([
			"Atrasada",
			"Vence hoy",
			"Empieza hoy",
		]);
		expect(tareas[0]).toMatchObject({
			fechaInicio: null,
			fechaVencimiento: "2026-10-28",
		});
	});
});
