import { describe, expect, it, mock } from "bun:test";
import { EliminarNotaUseCase } from "./EliminarNotaUseCase";
import { Nota } from "../../domain/Nota";
import { NotaNoEncontradaError } from "../../domain/error/NotaNoEncontradaError";

describe("EliminarNotaUseCase", () => {
	it("debería borrar si existe", async () => {
		const repo = {
			buscarPorId: mock(async () =>
				Nota.reconstituir(
					1,
					7,
					{ titulo: "Ejemplo", contenido: "", tagIds: [] },
					new Date(),
				),
			),
			eliminar: mock(async () => {}),
		};
		const useCase = new EliminarNotaUseCase(repo as never);

		await useCase.ejecutar(7, 1);

		expect(repo.eliminar).toHaveBeenCalledWith(1);
	});

	it("debería lanzar NotaNoEncontradaError si no existe", async () => {
		const repo = { buscarPorId: mock(async () => null), eliminar: mock() };
		const useCase = new EliminarNotaUseCase(repo as never);

		await expect(useCase.ejecutar(7, 999)).rejects.toThrow(
			NotaNoEncontradaError,
		);
		expect(repo.eliminar).not.toHaveBeenCalled();
	});
});
