import { describe, expect, it, mock } from "bun:test";
import { EliminarTareaUseCase } from "./EliminarTareaUseCase";
import { Tarea } from "../../domain/Tarea";
import { TareaNoEncontradaError } from "../../domain/error/TareaNoEncontradaError";

const eventBus = { publish: mock(async () => {}) };
const uow = { ejecutar: <T>(fn: () => Promise<T>) => fn() };
const crear = (repo: unknown) =>
	new EliminarTareaUseCase(repo as never, {} as never, eventBus as never, uow);

describe("EliminarTareaUseCase", () => {
	it("debería borrar si existe", async () => {
		const repo = {
			buscarPorId: mock(async () =>
				Tarea.reconstituir(
					1,
					7,
					Tarea.crear(7, { titulo: "Ejemplo" }).getDatos(),
				),
			),
			eliminar: mock(async () => {}),
		};
		const useCase = crear(repo);

		await useCase.ejecutar(7, 1);

		expect(repo.eliminar).toHaveBeenCalledWith(1);
		expect(eventBus.publish).toHaveBeenCalledWith(
			expect.objectContaining({
				eventName: "tarea.eliminada",
				data: { tareaId: 1 },
			}),
		);
	});

	it("debería lanzar TareaNoEncontradaError si no existe", async () => {
		const repo = { buscarPorId: mock(async () => null), eliminar: mock() };
		const useCase = crear(repo);

		await expect(useCase.ejecutar(7, 999)).rejects.toThrow(
			TareaNoEncontradaError,
		);
		expect(repo.eliminar).not.toHaveBeenCalled();
	});
});
