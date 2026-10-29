import { describe, expect, it, mock } from "bun:test";
import { EliminarTagUseCase } from "./EliminarTagUseCase";
import { Tag } from "../../domain/Tag";
import { TagNoEncontradoError } from "../../domain/error/TagNoEncontradoError";

/** Los tags personales no consultan la organización. */
const acceso = { exigir: mock(async () => {}) };

describe("EliminarTagUseCase", () => {
	it("debería borrar si existe", async () => {
		const repo = {
			buscarPorId: mock(async () =>
				Tag.reconstituir(1, { usuarioId: 7 }, "Ejemplo"),
			),
			eliminar: mock(async () => {}),
		};
		const useCase = new EliminarTagUseCase(repo as never, acceso);

		await useCase.ejecutar({ usuarioId: 7 }, 1);

		expect(repo.eliminar).toHaveBeenCalledWith(1);
	});

	it("debería lanzar TagNoEncontradoError si no existe", async () => {
		const repo = { buscarPorId: mock(async () => null), eliminar: mock() };
		const useCase = new EliminarTagUseCase(repo as never, acceso);

		await expect(useCase.ejecutar({ usuarioId: 7 }, 999)).rejects.toThrow(
			TagNoEncontradoError,
		);
		expect(repo.eliminar).not.toHaveBeenCalled();
	});
});
