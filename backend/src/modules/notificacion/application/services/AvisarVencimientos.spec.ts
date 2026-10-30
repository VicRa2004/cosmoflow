import { describe, expect, it, mock } from "bun:test";
import type { TareaPorVencer } from "../../domain/repository/NotificacionRepository";
import { AvisarVencimientos } from "./AvisarVencimientos";

const tarea = (datos: Partial<TareaPorVencer>): TareaPorVencer => ({
	id: 1,
	titulo: "Demo",
	fechaVencimiento: "2026-10-30",
	organizacionId: null,
	usuarioId: 7,
	responsableIds: [],
	...datos,
});

const preparar = (tareas: TareaPorVencer[]) => {
	const repo = { tareasPorVencer: mock(async () => tareas) };
	const notificador = { notificar: mock(async () => {}) };
	return {
		repo,
		notificador,
		avisar: new AvisarVencimientos(
			repo as never,
			notificador as never,
			"https://app.dev",
			"America/Mexico_City",
		),
	};
};

describe("AvisarVencimientos", () => {
	it("antes de las 8:00 locales no avisa", async () => {
		const { avisar, repo } = preparar([tarea({})]);
		// 13:00 UTC = 7:00 en Ciudad de México.
		await avisar.ejecutar(new Date("2026-10-30T13:00:00Z"));
		expect(repo.tareasPorVencer).not.toHaveBeenCalled();
	});

	it("usa el día local: a las 21:00 del 30 en México, en UTC ya es 31", async () => {
		const { avisar, repo } = preparar([]);
		await avisar.ejecutar(new Date("2026-10-31T03:00:00Z"));
		expect(repo.tareasPorVencer).toHaveBeenCalledWith([
			"2026-10-30",
			"2026-10-31",
		]);
	});

	it("avisa a los responsables o, si no hay, a quien la creó, con una clave por día", async () => {
		const { avisar, notificador } = preparar([
			tarea({ id: 1, responsableIds: [5, 6], organizacionId: 10 }),
			tarea({ id: 2, fechaVencimiento: "2026-10-31" }),
		]);
		await avisar.ejecutar(new Date("2026-10-30T15:00:00Z"));

		expect(notificador.notificar).toHaveBeenCalledWith(
			expect.objectContaining({
				evento: "vencimiento",
				usuarioIds: [5, 6],
				organizacionId: 10,
				clave: "vencimiento:1:2026-10-30:hoy",
				aviso: expect.objectContaining({ asunto: "«Demo» vence hoy" }),
			}),
		);
		expect(notificador.notificar).toHaveBeenCalledWith(
			expect.objectContaining({
				usuarioIds: [7],
				clave: "vencimiento:2:2026-10-31:mañana",
			}),
		);
	});
});
