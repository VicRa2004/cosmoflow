import { describe, expect, it, mock } from "bun:test";
import { TagDuplicadoError } from "../../domain/error/TagDuplicadoError";
import { TagNoEncontradoError } from "../../domain/error/TagNoEncontradoError";
import { Tag } from "../../domain/Tag";
import { ActualizarTagUseCase } from "./ActualizarTagUseCase";

/** Los tags personales no consultan la organización. */
const acceso = { exigir: mock(async () => []) };

const USUARIO = 7;

const repoCon = (otro: Tag | null) => ({
	buscarPorId: mock(async () =>
		Tag.reconstituir(1, { usuarioId: USUARIO }, "Viejo"),
	),
	buscarPorNombre: mock(async () => otro),
	actualizar: mock(async (e: Tag) => e),
});

describe("ActualizarTagUseCase", () => {
	it("actualiza el tag del usuario", async () => {
		const useCase = new ActualizarTagUseCase(repoCon(null) as never);

		expect(
			await useCase.ejecutar({ usuarioId: USUARIO }, 1, { nombre: "Nuevo" }),
		).toEqual({
			id: 1,
			nombre: "Nuevo",
		});
	});

	it("permite cambiar solo las mayúsculas de su propio nombre", async () => {
		const repo = repoCon(Tag.reconstituir(1, { usuarioId: USUARIO }, "Viejo"));
		const useCase = new ActualizarTagUseCase(repo as never, acceso);

		await useCase.ejecutar({ usuarioId: USUARIO }, 1, { nombre: "VIEJO" });

		expect(repo.actualizar).toHaveBeenCalled();
	});

	it("rechaza el nombre de otro tag del usuario", async () => {
		const repo = repoCon(Tag.reconstituir(2, { usuarioId: USUARIO }, "Nuevo"));
		const useCase = new ActualizarTagUseCase(repo as never, acceso);

		await expect(
			useCase.ejecutar({ usuarioId: USUARIO }, 1, { nombre: "nuevo" }),
		).rejects.toThrow(TagDuplicadoError);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});

	it("lanza TagNoEncontradoError si no existe o es de otro usuario", async () => {
		const repo = { buscarPorId: mock(async () => null), actualizar: mock() };
		const useCase = new ActualizarTagUseCase(repo as never, acceso);

		await expect(
			useCase.ejecutar({ usuarioId: USUARIO }, 999, { nombre: "Nuevo" }),
		).rejects.toThrow(TagNoEncontradoError);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});
});
