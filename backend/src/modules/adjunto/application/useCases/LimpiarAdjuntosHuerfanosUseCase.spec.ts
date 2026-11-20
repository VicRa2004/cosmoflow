import { describe, expect, it, mock } from "bun:test";
import type { Almacenamiento } from "@/core/shared/domain/Almacenamiento";
import type { AdjuntoRepository } from "../../domain/repository/AdjuntoRepository";
import { LimpiarAdjuntosHuerfanosUseCase } from "./LimpiarAdjuntosHuerfanosUseCase";

describe("LimpiarAdjuntosHuerfanosUseCase", () => {
	const ahora = new Date("2026-11-20T12:00:00Z");

	const preparar = (eliminarArchivo = mock(async (_clave: string) => {})) => {
		const repo = {
			buscarHuerfanos: mock(async () => [
				{ id: 1, clave: "adjuntos/1/a.png" },
				{ id: 2, clave: "adjuntos/1/b.png" },
			]),
			eliminar: mock(async (_id: number) => {}),
		};
		const useCase = new LimpiarAdjuntosHuerfanosUseCase(
			repo as unknown as AdjuntoRepository,
			{ eliminar: eliminarArchivo } as unknown as Almacenamiento,
		);
		return { repo, useCase, eliminarArchivo };
	};

	it("deja un día de margen y borra archivo y fila de cada huérfano", async () => {
		const { repo, useCase, eliminarArchivo } = preparar();

		expect(await useCase.ejecutar(ahora)).toBe(2);

		expect(repo.buscarHuerfanos).toHaveBeenCalledWith(
			new Date("2026-11-19T12:00:00Z"),
			200,
		);
		expect(eliminarArchivo.mock.calls).toEqual([
			["adjuntos/1/a.png"],
			["adjuntos/1/b.png"],
		]);
		expect(repo.eliminar.mock.calls).toEqual([[1], [2]]);
	});

	it("si falla borrar el archivo, conserva la fila para reintentarlo", async () => {
		const { repo, useCase } = preparar(
			mock(async () => {
				throw new Error("S3 caído");
			}),
		);

		await expect(useCase.ejecutar(ahora)).rejects.toThrow("S3 caído");
		expect(repo.eliminar).not.toHaveBeenCalled();
	});
});
