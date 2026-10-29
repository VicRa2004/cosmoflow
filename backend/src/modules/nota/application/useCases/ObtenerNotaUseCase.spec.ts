import { describe, expect, it, mock } from "bun:test";
import { ObtenerNotaUseCase } from "./ObtenerNotaUseCase";
import { Nota } from "../../domain/Nota";
import { NotaNoEncontradaError } from "../../domain/error/NotaNoEncontradaError";

describe("ObtenerNotaUseCase", () => {
	it("debería devolver el DTO si existe", async () => {
		const repo = {
			buscarPorId: mock(async () =>
				Nota.reconstituir(
					1,
					7,
					{ titulo: "Ejemplo", contenido: "", tagIds: [] },
					new Date(),
				),
			),
		};
		const useCase = new ObtenerNotaUseCase(repo as never);

		expect(await useCase.ejecutar(7, 1)).toMatchObject({ titulo: "Ejemplo" });
	});

	it("debería lanzar NotaNoEncontradaError si no existe", async () => {
		const repo = { buscarPorId: mock(async () => null) };
		const useCase = new ObtenerNotaUseCase(repo as never);

		await expect(useCase.ejecutar(7, 999)).rejects.toThrow(
			NotaNoEncontradaError,
		);
	});
});
