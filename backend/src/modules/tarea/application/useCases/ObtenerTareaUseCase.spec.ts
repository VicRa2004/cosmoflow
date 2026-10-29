import { describe, expect, it, mock } from "bun:test";
import { ObtenerTareaUseCase } from "./ObtenerTareaUseCase";
import { Tarea } from "../../domain/Tarea";
import { TareaNoEncontradaError } from "../../domain/error/TareaNoEncontradaError";

describe("ObtenerTareaUseCase", () => {
	it("debería devolver el DTO si existe", async () => {
		const repo = {
			buscarPorId: mock(async () =>
				Tarea.reconstituir(
					1,
					7,
					Tarea.crear(7, { titulo: "Ejemplo" }).getDatos(),
				),
			),
		};
		const useCase = new ObtenerTareaUseCase(repo as never);

		expect(await useCase.ejecutar(7, 1)).toMatchObject({ titulo: "Ejemplo" });
	});

	it("debería lanzar TareaNoEncontradaError si no existe", async () => {
		const repo = { buscarPorId: mock(async () => null) };
		const useCase = new ObtenerTareaUseCase(repo as never);

		await expect(useCase.ejecutar(7, 999)).rejects.toThrow(
			TareaNoEncontradaError,
		);
	});
});
