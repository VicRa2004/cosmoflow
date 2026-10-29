import { describe, expect, it, mock } from "bun:test";
import { TagDuplicadoError } from "../../domain/error/TagDuplicadoError";
import { Tag } from "../../domain/Tag";
import { CrearTagUseCase } from "./CrearTagUseCase";

const USUARIO = 7;

describe("CrearTagUseCase", () => {
	it("crea el tag para el usuario y devuelve el DTO", async () => {
		const repo = {
			buscarPorNombre: mock(async () => null),
			crear: mock(async (e: Tag) =>
				Tag.reconstituir(1, e.getUsuarioId(), e.getNombre()),
			),
		};
		const useCase = new CrearTagUseCase(repo as never);

		const result = await useCase.ejecutar(USUARIO, { nombre: "urgente" });

		expect(repo.crear.mock.calls[0]?.[0].getUsuarioId()).toBe(USUARIO);
		expect(result).toEqual({ id: 1, nombre: "urgente" });
	});

	it("rechaza un nombre que el usuario ya tiene", async () => {
		const repo = {
			buscarPorNombre: mock(async () =>
				Tag.reconstituir(1, USUARIO, "Urgente"),
			),
			crear: mock(),
		};
		const useCase = new CrearTagUseCase(repo as never);

		await expect(
			useCase.ejecutar(USUARIO, { nombre: "urgente" }),
		).rejects.toThrow(TagDuplicadoError);
		expect(repo.crear).not.toHaveBeenCalled();
	});
});
