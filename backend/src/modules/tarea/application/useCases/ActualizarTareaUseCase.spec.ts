import { describe, expect, it, mock } from "bun:test";
import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import { TareaNoEncontradaError } from "../../domain/error/TareaNoEncontradaError";
import { Tarea } from "../../domain/Tarea";
import { ActualizarTareaUseCase } from "./ActualizarTareaUseCase";

const USUARIO = 7;

const existente = (titulo: string) =>
	Tarea.reconstituir(1, USUARIO, Tarea.crear(USUARIO, { titulo }).getDatos());

const repoCon = (tarea: Tarea | null, tagsPropios = true) => ({
	buscarPorId: mock(async () => tarea),
	sonTagsPropios: mock(async () => tagsPropios),
	actualizar: mock(async (t: Tarea) => t),
});

describe("ActualizarTareaUseCase", () => {
	it("actualiza solo los campos enviados", async () => {
		const repo = repoCon(existente("Demo"));
		const useCase = new ActualizarTareaUseCase(repo as never);

		const dto = await useCase.ejecutar(USUARIO, 1, { estado: "completada" });

		expect(dto).toMatchObject({ titulo: "Demo", estado: "completada" });
		expect(repo.buscarPorId).toHaveBeenCalledWith(USUARIO, 1);
	});

	it("rechaza tags que no son del usuario", async () => {
		const repo = repoCon(existente("Demo"), false);
		const useCase = new ActualizarTareaUseCase(repo as never);

		await expect(useCase.ejecutar(USUARIO, 1, { tagIds: [3] })).rejects.toThrow(
			TagsAjenosError,
		);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});

	it("lanza TareaNoEncontradaError si no existe o es de otro usuario", async () => {
		const repo = repoCon(null);
		const useCase = new ActualizarTareaUseCase(repo as never);

		await expect(
			useCase.ejecutar(USUARIO, 999, { titulo: "x" }),
		).rejects.toThrow(TareaNoEncontradaError);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});
});
