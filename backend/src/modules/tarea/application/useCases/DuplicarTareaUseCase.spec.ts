import { describe, expect, it, mock } from "bun:test";
import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import { Tarea } from "../../domain/Tarea";
import { ContextosTarea } from "../services/ContextosTarea";
import { DuplicarTareaUseCase } from "./DuplicarTareaUseCase";

const USUARIO = 7;

const preparar = ({ puedeCrear = true } = {}) => {
	const original = Tarea.reconstituir(
		10,
		USUARIO,
		{
			titulo: "Preparar entrega",
			contenido: "# Checklist",
			estado: "completada",
			prioridad: "alta",
			fechaInicio: "2026-11-10",
			fechaVencimiento: "2026-11-15",
			color: "#6366f1",
			isFijada: true,
			tagIds: [2, 3],
			dependeDeId: 1,
			recurrencia: "semanal",
			subtareas: [{ id: 1, titulo: "Paso 1", completada: true }],
		},
		{ organizacionId: 10, equipoId: 5, proyectoId: null },
	);

	const repo = {
		buscarPorId: mock(async () => original),
		crear: mock(async (t: Tarea) =>
			Tarea.reconstituir(11, t.getUsuarioId(), t.getDatos(), t.getUbicacion()),
		),
	};
	const equipos = {
		contexto: mock(async () => ({
			organizacionId: 10,
			miembroIds: [USUARIO, 8],
			puedeCrear,
		})),
	};
	const vacio = { contexto: mock(async () => null) };
	const eventBus = { publish: mock(), publishAll: mock(async () => {}) };
	const uow = { ejecutar: <T>(fn: () => Promise<T>) => fn() };

	return {
		repo,
		eventBus,
		useCase: new DuplicarTareaUseCase(
			repo as never,
			new ContextosTarea(equipos, vacio, vacio),
			eventBus,
			uow,
		),
	};
};

describe("DuplicarTareaUseCase", () => {
	it("clona la tarea en el mismo contexto como pendiente, sin fijar y subtareas reiniciadas", async () => {
		const { useCase, eventBus } = preparar();

		const copia = await useCase.ejecutar(USUARIO, 10);

		expect(copia).toMatchObject({
			id: 11,
			titulo: "Preparar entrega (copia)",
			contenido: "# Checklist",
			estado: "pendiente",
			prioridad: "alta",
			color: "#6366f1",
			isFijada: false,
			tagIds: [2, 3],
			dependeDeId: null,
			organizacionId: 10,
			equipoId: 5,
			proyectoId: null,
			subtareas: [{ titulo: "Paso 1", completada: false }],
		});
		expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
	});

	it("exige permiso de creación en equipos con líder (RN-22)", async () => {
		const { useCase, repo } = preparar({ puedeCrear: false });
		await expect(useCase.ejecutar(USUARIO, 10)).rejects.toThrow(
			SinPermisoTareasError,
		);
		expect(repo.crear).not.toHaveBeenCalled();
	});
});
