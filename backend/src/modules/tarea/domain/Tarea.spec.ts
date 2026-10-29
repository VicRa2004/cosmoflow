import { describe, expect, it } from "bun:test";
import { TareaInvalidaError } from "./error/TareaInvalidaError";
import { Tarea } from "./Tarea";

describe("Tarea", () => {
	it("una tarea nueva es pendiente, de prioridad media y sin fechas ni tags", () => {
		expect(Tarea.crear(7, { titulo: "Demo" }).getDatos()).toEqual({
			titulo: "Demo",
			contenido: "",
			estado: "pendiente",
			prioridad: "media",
			fechaInicio: null,
			fechaVencimiento: null,
			tagIds: [],
		});
	});

	it("rechaza un inicio posterior al vencimiento, al crear y al actualizar", () => {
		expect(() =>
			Tarea.crear(7, {
				titulo: "Demo",
				fechaInicio: "2026-11-02",
				fechaVencimiento: "2026-11-01",
			}),
		).toThrow(TareaInvalidaError);

		const tarea = Tarea.crear(7, { titulo: "Demo", fechaInicio: "2026-11-02" });
		expect(() => tarea.actualizar({ fechaVencimiento: "2026-11-01" })).toThrow(
			TareaInvalidaError,
		);
		expect(tarea.getDatos().fechaVencimiento).toBeNull();
	});

	it("al actualizar, undefined conserva el campo y null vacía la fecha", () => {
		const tarea = Tarea.crear(7, {
			titulo: "Demo",
			fechaVencimiento: "2026-11-01",
		});

		tarea.actualizar({ titulo: undefined, fechaVencimiento: null });

		expect(tarea.getDatos()).toMatchObject({
			titulo: "Demo",
			fechaVencimiento: null,
		});
	});

	it("no repite tags", () => {
		const tarea = Tarea.crear(7, { titulo: "Demo", tagIds: [1, 2, 1] });
		expect(tarea.getDatos().tagIds).toEqual([1, 2]);
	});
});
