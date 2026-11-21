import { describe, expect, it } from "bun:test";
import { TareaInvalidaError } from "./error/TareaInvalidaError";
import { avanzarDia, Tarea } from "./Tarea";

describe("Tarea", () => {
	it("una tarea nueva es pendiente, de prioridad media y sin fechas ni tags", () => {
		expect(Tarea.crear(7, { titulo: "Demo" }).getDatos()).toEqual({
			titulo: "Demo",
			contenido: "",
			estado: "pendiente",
			prioridad: "media",
			fechaInicio: null,
			fechaVencimiento: null,
			color: null,
			tagIds: [],
			dependeDeId: null,
			recurrencia: null,
			subtareas: [],
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

	it("guarda quién asignó a cada responsable y lo conserva en los que siguen", () => {
		const tarea = Tarea.reconstituir(
			1,
			7,
			Tarea.crear(7, { titulo: "Demo" }).getDatos(),
			{ organizacionId: 10, equipoId: null, proyectoId: null },
			[8, 9],
			[],
			false,
			{ 8: 7 },
		);

		tarea.asignar([8, 9, 11], 5);

		// 9 venía sin asignador (asignación antigua): sigue sin él.
		expect(tarea.getAsignadoPor()).toEqual({ 8: 7, 11: 5 });
	});

	it("no repite tags", () => {
		const tarea = Tarea.crear(7, { titulo: "Demo", tagIds: [1, 2, 1] });
		expect(tarea.getDatos().tagIds).toEqual([1, 2]);
	});

	it("guarda solo las menciones de quien tiene acceso y avisa de las nuevas", () => {
		const tarea = Tarea.reconstituir(
			1,
			7,
			Tarea.crear(7, { titulo: "Demo" }).getDatos(),
			{ organizacionId: 10, equipoId: null, proyectoId: null },
			[],
			[8],
		);
		tarea.actualizar({
			contenido:
				"Hola [@Beto](mencion:8), [@Caro](mencion:9) y [@Zoe](mencion:99)",
		});
		tarea.mencionar([7, 8, 9]);

		expect(tarea.getMencionIds()).toEqual([8, 9]);
		expect(tarea.pullDomainEvents()).toEqual([
			expect.objectContaining({
				eventName: "tarea.mencionados",
				data: { tareaId: 1, usuarioIds: [9] },
			}),
		]);
	});

	it("al actualizar, registra solo los campos del historial que cambian", () => {
		const tarea = Tarea.reconstituir(
			1,
			7,
			Tarea.crear(7, { titulo: "Antes" }).getDatos(),
		);
		tarea.actualizar({
			titulo: "Después",
			prioridad: "media",
			fechaVencimiento: "2030-01-15",
			contenido: "No sale en el historial",
		});
		tarea.actualizar({ titulo: "Después" });
		expect(tarea.pullDomainEvents()).toEqual([
			expect.objectContaining({
				eventName: "tarea.actualizada",
				data: {
					tareaId: 1,
					cambios: {
						titulo: { anterior: "Antes", nuevo: "Después" },
						fechaVencimiento: { anterior: null, nuevo: "2030-01-15" },
					},
				},
			}),
		]);
	});

	it("avanza días para recurrencia diaria, semanal y mensual (acotando fin de mes)", () => {
		expect(avanzarDia("2026-11-30", "diaria")).toBe("2026-12-01");
		expect(avanzarDia("2026-11-25", "semanal")).toBe("2026-12-02");
		expect(avanzarDia("2026-01-31", "mensual")).toBe("2026-02-28");
		expect(avanzarDia("2028-01-31", "mensual")).toBe("2028-02-29");
	});

	it("genera la siguiente ocurrencia pendiente con subtareas reiniciadas y sin dependencia", () => {
		const tarea = Tarea.reconstituir(
			10,
			7,
			Tarea.crear(7, {
				titulo: "Reporte semanal",
				prioridad: "alta",
				fechaInicio: "2026-11-16",
				fechaVencimiento: "2026-11-20",
				dependeDeId: 3,
				recurrencia: "semanal",
				subtareas: [
					{ titulo: "Reunir métricas", completada: true },
					{ titulo: "Enviar resumen", completada: true },
				],
			}).getDatos(),
			{ organizacionId: 1, equipoId: null, proyectoId: 2 },
			[7, 8],
			[],
			false,
			{ 8: 7 },
		);

		const siguiente = tarea.siguienteOcurrencia("2026-11-20");
		expect(siguiente).not.toBeNull();
		expect(siguiente?.getDatos()).toMatchObject({
			titulo: "Reporte semanal",
			estado: "pendiente",
			prioridad: "alta",
			fechaInicio: "2026-11-23",
			fechaVencimiento: "2026-11-27",
			dependeDeId: null,
			recurrencia: "semanal",
			subtareas: [
				{ titulo: "Reunir métricas", completada: false },
				{ titulo: "Enviar resumen", completada: false },
			],
		});
		expect(siguiente?.getResponsableIds()).toEqual([7, 8]);
	});

	it("rechaza una subtarea con título vacío", () => {
		expect(() =>
			Tarea.crear(7, {
				titulo: "Demo",
				subtareas: [{ titulo: "   ", completada: false }],
			}),
		).toThrow(TareaInvalidaError);
	});
});
