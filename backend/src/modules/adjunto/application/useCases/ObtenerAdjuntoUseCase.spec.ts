import { describe, expect, it, mock } from "bun:test";
import { AdjuntoNoEncontradoError } from "../../domain/error/AdjuntoNoEncontradoError";
import { ObtenerAdjuntoUseCase } from "./ObtenerAdjuntoUseCase";

const adjunto = {
	id: 12,
	usuarioId: 7,
	clave: "adjuntos/7/x.png",
	tipo: "image/png",
	bytes: 3,
};

describe("ObtenerAdjuntoUseCase", () => {
	it("debería devolver los bytes y el tipo del adjunto propio", async () => {
		const datos = new Uint8Array([1, 2, 3]);
		const useCase = new ObtenerAdjuntoUseCase(
			{ buscarPorId: mock(async () => adjunto) } as never,
			{ obtener: mock(async () => datos) } as never,
		);

		expect(await useCase.ejecutar(7, 12)).toEqual({ datos, tipo: "image/png" });
	});

	it("debería lanzar 404 si no es del usuario", async () => {
		const useCase = new ObtenerAdjuntoUseCase(
			{ buscarPorId: mock(async () => null) } as never,
			{ obtener: mock(async () => null) } as never,
		);

		await expect(useCase.ejecutar(8, 12)).rejects.toThrow(
			AdjuntoNoEncontradoError,
		);
	});

	it("debería lanzar 404 si falta el archivo en el almacenamiento", async () => {
		const useCase = new ObtenerAdjuntoUseCase(
			{ buscarPorId: mock(async () => adjunto) } as never,
			{ obtener: mock(async () => null) } as never,
		);

		await expect(useCase.ejecutar(7, 12)).rejects.toThrow(
			AdjuntoNoEncontradoError,
		);
	});
});
