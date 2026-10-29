import { describe, expect, it, mock } from "bun:test";
import { ObtenerTagUseCase } from "./ObtenerTagUseCase";
import { Tag } from "../../domain/Tag";
import { TagNoEncontradoError } from "../../domain/error/TagNoEncontradoError";

describe("ObtenerTagUseCase", () => {
	it("debería devolver el DTO si existe", async () => {
		const repo = {
			buscarPorId: mock(async () => Tag.reconstituir(1, 7, "Ejemplo")),
		};
		const useCase = new ObtenerTagUseCase(repo as never);

		expect(await useCase.ejecutar(7, 1)).toEqual({ id: 1, nombre: "Ejemplo" });
	});

	it("debería lanzar TagNoEncontradoError si no existe", async () => {
		const repo = { buscarPorId: mock(async () => null) };
		const useCase = new ObtenerTagUseCase(repo as never);

		await expect(useCase.ejecutar(7, 999)).rejects.toThrow(
			TagNoEncontradoError,
		);
	});
});
