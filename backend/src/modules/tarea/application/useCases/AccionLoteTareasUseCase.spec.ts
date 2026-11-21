import { describe, expect, it, mock } from "bun:test";
import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import { Tarea } from "../../domain/Tarea";
import { ContextosTarea } from "../services/ContextosTarea";
import { AccionLoteTareasUseCase } from "./AccionLoteTareasUseCase";
import { EliminarLoteTareasUseCase } from "./EliminarLoteTareasUseCase";

const USUARIO = 7;

const tareaPersonal = (id: number, tagIds: number[] = []) =>
	Tarea.reconstituir(id, USUARIO, {
		titulo: `Tarea ${id}`,
		contenido: "",
		estado: "pendiente",
		prioridad: "media",
		fechaInicio: null,
		fechaVencimiento: null,
		color: null,
		tagIds,
		dependeDeId: null,
		recurrencia: null,
		subtareas: [],
	});

describe("AccionLoteTareasUseCase y EliminarLoteTareasUseCase", () => {
	it("actualiza estado, prioridad y tags en lote dentro de una transacción", async () => {
		const tareas = new Map<number, Tarea>([
			[1, tareaPersonal(1, [10])],
			[2, tareaPersonal(2, [])],
		]);
		const repo = {
			buscarPorId: mock(async (id: number) => tareas.get(id) ?? null),
			sonTagsDe: mock(async () => true),
			actualizar: mock(async (t: Tarea) => t),
			crear: mock(async (t: Tarea) => t),
		};
		const vacio = { contexto: mock(async () => null) };
		const eventBus = { publish: mock(), publishAll: mock(async () => {}) };
		const uow = { ejecutar: <T>(fn: () => Promise<T>) => fn() };
		const useCase = new AccionLoteTareasUseCase(
			repo as never,
			new ContextosTarea(vacio, vacio, vacio),
			eventBus,
			uow,
		);

		const resEstado = await useCase.ejecutar(USUARIO, {
			ids: [1, 2, 1],
			accion: "estado",
			estado: "completada",
		});
		expect(resEstado).toEqual({ afectadas: 2 });
		expect(tareas.get(1)?.getDatos().estado).toBe("completada");
		expect(tareas.get(2)?.getDatos().estado).toBe("completada");

		await useCase.ejecutar(USUARIO, {
			ids: [2],
			accion: "agregar_tag",
			tagId: 10,
		});
		expect(tareas.get(2)?.getDatos().tagIds).toEqual([10]);

		await useCase.ejecutar(USUARIO, {
			ids: [1, 2],
			accion: "quitar_tag",
			tagId: 10,
		});
		expect(tareas.get(1)?.getDatos().tagIds).toEqual([]);
		expect(tareas.get(2)?.getDatos().tagIds).toEqual([]);
	});

	it("rechaza eliminación en lote si falta permiso en alguna tarea compartida", async () => {
		const compartida = Tarea.reconstituir(
			9,
			USUARIO,
			tareaPersonal(9).getDatos(),
			{ organizacionId: 10, equipoId: 5, proyectoId: null },
		);
		const repo = {
			buscarPorId: mock(async () => compartida),
			eliminar: mock(),
		};
		const equipos = {
			contexto: mock(async () => ({
				organizacionId: 10,
				miembroIds: [USUARIO],
				puedeCrear: false,
			})),
		};
		const vacio = { contexto: mock(async () => null) };
		const eventBus = { publish: mock(async () => {}), publishAll: mock() };
		const uow = { ejecutar: <T>(fn: () => Promise<T>) => fn() };

		const useCase = new EliminarLoteTareasUseCase(
			repo as never,
			new ContextosTarea(equipos, vacio, vacio),
			eventBus,
			uow,
		);

		await expect(useCase.ejecutar(USUARIO, [9])).rejects.toThrow(
			SinPermisoTareasError,
		);
		expect(repo.eliminar).not.toHaveBeenCalled();
	});
});
