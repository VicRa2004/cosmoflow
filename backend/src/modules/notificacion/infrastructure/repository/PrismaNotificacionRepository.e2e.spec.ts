import { beforeAll, describe, expect, it } from "bun:test";
import { prisma } from "@/core/config/prisma";
import { crearUsuario, vaciarUsuarios } from "@/test/e2e";
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
