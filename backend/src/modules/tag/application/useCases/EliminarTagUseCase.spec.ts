import { describe, expect, it, mock } from "bun:test";
import { EliminarTagUseCase } from "./EliminarTagUseCase";
import { Tag } from "../../domain/Tag";
import { TagNoEncontradoError } from "../../domain/error/TagNoEncontradoError";

describe("EliminarTagUseCase", () => {
	it("debería borrar si existe", async () => {
		const repo = {
			buscarPorId: mock(async () => Tag.reconstituir(1, 7, "Ejemplo")),
			eliminar: mock(async () => {}),
		};
		const useCase = new EliminarTagUseCase(repo as never);

		await useCase.ejecutar(7, 1);

		expect(repo.eliminar).toHaveBeenCalledWith(1);
	});

	it("debería lanzar TagNoEncontradoError si no existe", async () => {
		const repo = { buscarPorId: mock(async () => null), eliminar: mock() };
		const useCase = new EliminarTagUseCase(repo as never);

		await expect(useCase.ejecutar(7, 999)).rejects.toThrow(
			TagNoEncontradoError,
		);
		expect(repo.eliminar).not.toHaveBeenCalled();
	});
});
