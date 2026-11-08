import { describe, expect, it, mock } from "bun:test";
import { CarpetaInvalidaError } from "../../domain/error/CarpetaInvalidaError";
import { NotaNoEncontradaError } from "../../domain/error/NotaNoEncontradaError";
import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import { Nota } from "../../domain/Nota";
import { ProyectosNota } from "../services/ProyectosNota";
import { ActualizarNotaUseCase } from "./ActualizarNotaUseCase";

const USUARIO = 7;

const preparar = (nota: Nota | null, tagsValidos = true) => {
	const repo = {
		buscarPorId: mock(async () => nota),
		sonTagsDe: mock(async () => tagsValidos),
		esCarpetaDe: mock(async () => false),
		actualizar: mock(async (n: Nota) => n),
	};
	return {
		repo,
		useCase: new ActualizarNotaUseCase(
			repo as never,
			new ProyectosNota(repo as never, { contexto: mock(async () => null) }),
		),
	};
};

const existente = () =>
	Nota.reconstituir(
		1,
		USUARIO,
		{ titulo: "Demo", contenido: "x", tagIds: [], carpetaId: null },
		new Date(),
	);

describe("ActualizarNotaUseCase", () => {
	it("actualiza solo los campos enviados", async () => {
		const { useCase } = preparar(existente());
		const dto = await useCase.ejecutar(USUARIO, 1, { titulo: "Nuevo" });
		expect(dto).toMatchObject({ titulo: "Nuevo", contenido: "x" });
	});

	it("rechaza tags que no son del usuario", async () => {
		const { useCase, repo } = preparar(existente(), false);
		await expect(useCase.ejecutar(USUARIO, 1, { tagIds: [3] })).rejects.toThrow(
			TagsAjenosError,
		);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});

	it("rechaza mover la nota a una carpeta de otro ámbito", async () => {
		const { useCase, repo } = preparar(existente());
		await expect(
			useCase.ejecutar(USUARIO, 1, { carpetaId: 9 }),
		).rejects.toThrow(CarpetaInvalidaError);
		expect(repo.esCarpetaDe).toHaveBeenCalledWith({ usuarioId: USUARIO }, 9);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});

	it("lanza NotaNoEncontradaError si no existe o es de otro usuario", async () => {
		await expect(
			preparar(null).useCase.ejecutar(USUARIO, 1, { titulo: "x" }),
		).rejects.toThrow(NotaNoEncontradaError);
		await expect(
			preparar(existente()).useCase.ejecutar(8, 1, { titulo: "x" }),
		).rejects.toThrow(NotaNoEncontradaError);
	});
});
