import { describe, expect, it, mock } from "bun:test";
import { EliminarTareaUseCase } from "./EliminarTareaUseCase";
import { Tarea } from "../../domain/Tarea";
import { TareaNoEncontradaError } from "../../domain/error/TareaNoEncontradaError";

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
		const useCase = new EliminarTareaUseCase(repo as never);

		await useCase.ejecutar(7, 1);

		expect(repo.eliminar).toHaveBeenCalledWith(1);
	});

	it("debería lanzar TareaNoEncontradaError si no existe", async () => {
		const repo = { buscarPorId: mock(async () => null), eliminar: mock() };
		const useCase = new EliminarTareaUseCase(repo as never);

		await expect(useCase.ejecutar(7, 999)).rejects.toThrow(
			TareaNoEncontradaError,
		);
		expect(repo.eliminar).not.toHaveBeenCalled();
	});
});
