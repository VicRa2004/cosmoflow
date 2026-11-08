import { describe, expect, it, mock } from "bun:test";
import { ObtenerIndiceNotasUseCase } from "./ObtenerIndiceNotasUseCase";

describe("ObtenerIndiceNotasUseCase", () => {
	const fila = { id: 1, titulo: "Ejemplo", color: null, carpetaId: null };
	const repo = { buscarIndice: mock(async () => [fila]) };

	it("sin proyecto busca en las personales del usuario", async () => {
		const exigir = mock(async () => {});
		const useCase = new ObtenerIndiceNotasUseCase(
			repo as never,
			{ exigir } as never,
		);

		expect(await useCase.ejecutar(7, { busqueda: "ej" })).toEqual([fila]);
		expect(exigir).not.toHaveBeenCalled();
		expect(repo.buscarIndice).toHaveBeenLastCalledWith(
			{ usuarioId: 7 },
			{ busqueda: "ej" },
		);
	});

	it("con proyecto exige acceso antes de buscar", async () => {
		const exigir = mock(async () => {
			throw new Error("sin acceso");
		});
		repo.buscarIndice.mockClear();
		const useCase = new ObtenerIndiceNotasUseCase(
			repo as never,
			{ exigir } as never,
		);

		await expect(useCase.ejecutar(7, { proyectoId: 3 })).rejects.toThrow(
			"sin acceso",
		);
		expect(repo.buscarIndice).not.toHaveBeenCalled();
	});
});
