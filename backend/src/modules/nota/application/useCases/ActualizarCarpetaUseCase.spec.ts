import { describe, expect, it, mock } from "bun:test";
import { CarpetaNota } from "../../domain/CarpetaNota";
import { CarpetaInvalidaError } from "../../domain/error/CarpetaInvalidaError";
import { CarpetaNoEncontradaError } from "../../domain/error/CarpetaNoEncontradaError";
import { CarpetasNota } from "../services/CarpetasNota";
import { ProyectosNota } from "../services/ProyectosNota";
import { ActualizarCarpetaUseCase } from "./ActualizarCarpetaUseCase";

const USUARIO = 7;
const carpeta = (id: number, padreId: number | null) =>
	CarpetaNota.reconstituir(id, USUARIO, {
		nombre: `c${id}`,
		icono: null,
		color: null,
		padreId,
	});

// Árbol: 1 › 2 › 3, y 4 suelta en la raíz.
const preparar = () => {
	const arbol = [
		carpeta(1, null),
		carpeta(2, 1),
		carpeta(3, 2),
		carpeta(4, null),
	];
	const repo = {
		buscar: mock(async () => arbol),
		buscarPorId: mock(
			async (id: number) => arbol.find((c) => c.getId() === id) ?? null,
		),
		actualizar: mock(async (c: CarpetaNota) => c),
	};
	const proyectos = new ProyectosNota({} as never, {
		contexto: mock(async () => null),
	});
	return {
		repo,
		useCase: new ActualizarCarpetaUseCase(
			repo as never,
			new CarpetasNota(repo as never, proyectos),
		),
	};
};

describe("ActualizarCarpetaUseCase", () => {
	it("renombra, cambia icono y color y la mueve", async () => {
		const { useCase } = preparar();
		const dto = await useCase.ejecutar(USUARIO, 3, {
			nombre: "Viajes",
			icono: "✈️",
			color: "#f59e0b",
			padreId: 4,
		});
		expect(dto).toMatchObject({
			nombre: "Viajes",
			icono: "✈️",
			color: "#f59e0b",
			padreId: 4,
		});
	});

	it("no la mete dentro de sí misma ni de una descendiente", async () => {
		const { useCase, repo } = preparar();
		await expect(useCase.ejecutar(USUARIO, 1, { padreId: 1 })).rejects.toThrow(
			CarpetaInvalidaError,
		);
		await expect(useCase.ejecutar(USUARIO, 1, { padreId: 3 })).rejects.toThrow(
			CarpetaInvalidaError,
		);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});

	it("rechaza un padre de otro ámbito y oculta las ajenas (404)", async () => {
		const { useCase } = preparar();
		await expect(useCase.ejecutar(USUARIO, 1, { padreId: 99 })).rejects.toThrow(
			CarpetaInvalidaError,
		);
		await expect(useCase.ejecutar(8, 1, { nombre: "x" })).rejects.toThrow(
			CarpetaNoEncontradaError,
		);
	});
});
