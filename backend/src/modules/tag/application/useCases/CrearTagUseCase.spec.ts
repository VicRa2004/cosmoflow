import { describe, expect, it, mock } from "bun:test";
import { TagDuplicadoError } from "../../domain/error/TagDuplicadoError";
import { Tag } from "../../domain/Tag";
import { CrearTagUseCase } from "./CrearTagUseCase";

/** Los tags personales no consultan la organización. */
const acceso = { exigir: mock(async () => {}) };

const USUARIO = 7;

describe("CrearTagUseCase", () => {
	it("crea el tag para el usuario y devuelve el DTO", async () => {
		const repo = {
			buscarPorNombre: mock(async () => null),
			crear: mock(async (e: Tag) =>
				Tag.reconstituir(1, e.getDueno(), e.getNombre()),
			),
		};
		const useCase = new CrearTagUseCase(repo as never, acceso);

		const result = await useCase.ejecutar(
			{ usuarioId: USUARIO },
			{ nombre: "urgente" },
		);

		expect(repo.crear.mock.calls[0]?.[0].getDueno()).toEqual({
			usuarioId: USUARIO,
		});
		expect(result).toEqual({ id: 1, nombre: "urgente" });
	});

	it("rechaza un nombre que el usuario ya tiene", async () => {
		const repo = {
			buscarPorNombre: mock(async () =>
				Tag.reconstituir(1, { usuarioId: USUARIO }, "Urgente"),
			),
			crear: mock(),
		};
		const useCase = new CrearTagUseCase(repo as never, acceso);

		await expect(
			useCase.ejecutar({ usuarioId: USUARIO }, { nombre: "urgente" }),
		).rejects.toThrow(TagDuplicadoError);
		expect(repo.crear).not.toHaveBeenCalled();
	});
});

describe("CrearTagUseCase en una organización", () => {
	it("exige tags:gestionar y la organización queda como dueña (RN-60)", async () => {
		const exigir = mock(async () => {});
		const repo = {
			buscarPorNombre: mock(async () => null),
			crear: mock(async (e: Tag) =>
				Tag.reconstituir(1, e.getDueno(), e.getNombre()),
			),
		};
		const useCase = new CrearTagUseCase(repo as never, { exigir });

		await useCase.ejecutar(
			{ usuarioId: USUARIO, organizacionId: 3 },
			{ nombre: "backend" },
		);

		expect(exigir).toHaveBeenCalledWith(USUARIO, 3, "tags:gestionar");
		expect(repo.crear.mock.calls[0]?.[0].getDueno()).toEqual({
			organizacionId: 3,
		});
	});

	it("si el acceso falla no crea nada", async () => {
		const repo = { buscarPorNombre: mock(), crear: mock() };
		const useCase = new CrearTagUseCase(repo as never, {
			exigir: mock(async () => {
				throw new Error("403");
			}),
		});

		expect(
			useCase.ejecutar(
				{ usuarioId: USUARIO, organizacionId: 3 },
				{ nombre: "backend" },
			),
		).rejects.toThrow("403");
		expect(repo.crear).not.toHaveBeenCalled();
	});
});
