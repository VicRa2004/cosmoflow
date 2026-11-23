import { describe, expect, it, mock } from "bun:test";
import type { TareaDelDia } from "../../domain/repository/NotificacionRepository";
import { EnviarResumenDiario } from "./EnviarResumenDiario";

const tarea = (datos: Partial<TareaDelDia>): TareaDelDia => ({
	id: 1,
	titulo: "Demo",
	fechaInicio: null,
	fechaVencimiento: null,
	...datos,
});

const preparar = (tareas: TareaDelDia[]) => {
	const repo = {
		usuariosConResumenDiario: mock(async () => [7]),
		tareasDelDia: mock(async () => tareas),
	};
	const notificador = { notificar: mock(async () => {}) };
	return {
		repo,
		notificador,
		resumen: new EnviarResumenDiario(
			repo as never,
			notificador as never,
			"https://app.dev",
			"America/Mexico_City",
		),
	};
};

// 15:00 UTC = 9:00 del 30 de octubre en Ciudad de México.
const nueve = new Date("2026-10-30T15:00:00Z");

describe("EnviarResumenDiario", () => {
	it("antes de las 8:00 locales no hace nada", async () => {
		const { resumen, repo } = preparar([]);
		await resumen.ejecutar(new Date("2026-10-30T13:00:00Z"));
		expect(repo.usuariosConResumenDiario).not.toHaveBeenCalled();
	});

	it("sin nada para hoy no avisa", async () => {
		const { resumen, repo, notificador } = preparar([]);
		await resumen.ejecutar(nueve);
		expect(repo.tareasDelDia).toHaveBeenCalledWith(7, "2026-10-30");
		expect(notificador.notificar).not.toHaveBeenCalled();
	});

	it("agrupa en vencen hoy, atrasadas y empiezan hoy, una vez por día", async () => {
		const { resumen, notificador } = preparar([
			tarea({ id: 1, titulo: "Vieja", fechaVencimiento: "2026-10-28" }),
			tarea({
				id: 2,
				titulo: "Hoy",
				fechaInicio: "2026-10-30",
				fechaVencimiento: "2026-10-30",
			}),
			tarea({ id: 3, titulo: "Arranca", fechaInicio: "2026-10-30" }),
			tarea({
				id: 4,
				titulo: "Larga",
				fechaInicio: "2026-10-30",
				fechaVencimiento: "2026-11-15",
			}),
		]);
		await resumen.ejecutar(nueve);

		expect(notificador.notificar).toHaveBeenCalledWith({
			evento: "resumenDiario",
			usuarioIds: [7],
			organizacionId: null,
			clave: "resumenDiario:2026-10-30",
			aviso: {
				asunto: "Tu día en Cosmoflow: 1 vence hoy, 1 atrasada, 2 empiezan hoy",
				texto:
					"Vencen hoy (1): «Hoy».\nAtrasadas (1): «Vieja».\nEmpiezan hoy (2): «Arranca», «Larga».",
				enlace: "https://app.dev/dashboard",
			},
		});
	});

	it("lista como mucho 5 títulos por grupo", async () => {
		const { resumen, notificador } = preparar(
			Array.from({ length: 7 }, (_, i) =>
				tarea({ id: i, titulo: `T${i}`, fechaVencimiento: "2026-10-30" }),
			),
		);
		await resumen.ejecutar(nueve);
		const [{ aviso }] = notificador.notificar.mock.calls[0] as unknown as [
			{ aviso: { texto: string } },
		];
		expect(aviso.texto).toBe(
			"Vencen hoy (7): «T0», «T1», «T2», «T3», «T4» y 2 más.",
		);
	});
});
