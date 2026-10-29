import { describe, expect, it, mock } from "bun:test";
import { NotaNoEncontradaError } from "../../domain/error/NotaNoEncontradaError";
import { Nota } from "../../domain/Nota";
import { ProyectosNota } from "../services/ProyectosNota";
import { EliminarNotaUseCase } from "./EliminarNotaUseCase";

const preparar = (nota: Nota | null) => {
	const repo = {
		buscarPorId: mock(async () => nota),
		eliminar: mock(async () => {}),
	};
	return {
		repo,
		useCase: new EliminarNotaUseCase(
			repo as never,
			new ProyectosNota(repo as never, { contexto: mock(async () => null) }),
		),
	};
};

describe("EliminarNotaUseCase", () => {
	it("debería borrar si existe", async () => {
		const { useCase, repo } = preparar(
			Nota.reconstituir(
				3,
				7,
				{ titulo: "x", contenido: "", tagIds: [] },
				new Date(),
			),
		);
		await useCase.ejecutar(7, 3);
		expect(repo.eliminar).toHaveBeenCalledWith(3);
	});

	it("debería lanzar NotaNoEncontradaError si no existe", async () => {
		const { useCase, repo } = preparar(null);
		await expect(useCase.ejecutar(7, 3)).rejects.toThrow(NotaNoEncontradaError);
		expect(repo.eliminar).not.toHaveBeenCalled();
	});
});
