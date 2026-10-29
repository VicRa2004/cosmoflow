import { describe, expect, it, mock } from "bun:test";
import { NotaNoEncontradaError } from "../../domain/error/NotaNoEncontradaError";
import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import { Nota } from "../../domain/Nota";
import { ActualizarNotaUseCase } from "./ActualizarNotaUseCase";

const USUARIO = 7;

const existente = () =>
	Nota.reconstituir(
		1,
		USUARIO,
		{ titulo: "Ideas", contenido: "texto", tagIds: [2] },
		new Date(),
	);

const repoCon = (nota: Nota | null, tagsPropios = true) => ({
	buscarPorId: mock(async () => nota),
	sonTagsPropios: mock(async () => tagsPropios),
	actualizar: mock(async (n: Nota) => n),
});

describe("ActualizarNotaUseCase", () => {
	it("actualiza solo los campos enviados", async () => {
		const repo = repoCon(existente());
		const useCase = new ActualizarNotaUseCase(repo as never);

		const dto = await useCase.ejecutar(USUARIO, 1, { contenido: "" });

		expect(dto).toMatchObject({ titulo: "Ideas", contenido: "", tagIds: [2] });
		expect(repo.buscarPorId).toHaveBeenCalledWith(USUARIO, 1);
	});

	it("rechaza tags que no son del usuario", async () => {
		const repo = repoCon(existente(), false);
		const useCase = new ActualizarNotaUseCase(repo as never);

		await expect(useCase.ejecutar(USUARIO, 1, { tagIds: [3] })).rejects.toThrow(
			TagsAjenosError,
		);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});

	it("lanza NotaNoEncontradaError si no existe o es de otro usuario", async () => {
		const repo = repoCon(null);
		const useCase = new ActualizarNotaUseCase(repo as never);

		await expect(
			useCase.ejecutar(USUARIO, 999, { titulo: "x" }),
		).rejects.toThrow(NotaNoEncontradaError);
	});
});
