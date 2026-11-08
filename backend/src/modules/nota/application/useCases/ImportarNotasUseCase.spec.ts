import { describe, expect, it, mock } from "bun:test";
import { CarpetaNota } from "../../domain/CarpetaNota";
import { CarpetaInvalidaError } from "../../domain/error/CarpetaInvalidaError";
import type { Nota } from "../../domain/Nota";
import { ProyectosNota } from "../services/ProyectosNota";
import { ImportarNotasUseCase } from "./ImportarNotasUseCase";

const USUARIO = 7;

const preparar = () => {
	// Ya existe «Viajes» en la raíz.
	const carpetas = [
		CarpetaNota.reconstituir(1, USUARIO, {
			nombre: "Viajes",
			icono: null,
			color: null,
			padreId: null,
		}),
	];
	let siguiente = 10;
	const carpetaRepo = {
		buscar: mock(async () => carpetas),
		crear: mock(async (c: CarpetaNota) =>
			CarpetaNota.reconstituir(siguiente++, USUARIO, c.getDatos()),
		),
	};
	const notas: Nota[] = [];
	const notaRepo = {
		crear: mock(async (n: Nota) => {
			notas.push(n);
			return n;
		}),
	};
	const useCase = new ImportarNotasUseCase(
		notaRepo as never,
		carpetaRepo as never,
		new ProyectosNota(notaRepo as never, { contexto: mock(async () => null) }),
		{ ejecutar: (trabajo) => trabajo() },
	);
	return { useCase, carpetaRepo, notas };
};

describe("ImportarNotasUseCase", () => {
	it("reutiliza las carpetas existentes y crea solo las que faltan", async () => {
		const { useCase, carpetaRepo, notas } = preparar();
		const resultado = await useCase.ejecutar(USUARIO, {
			notas: [
				{
					carpeta: ["Viajes", "Europa"],
					titulo: "Lisboa",
					contenido: "[[Oporto]]",
				},
				{ carpeta: ["Viajes", "Europa"], titulo: "Oporto", contenido: "" },
				{ carpeta: [], titulo: "Suelta", contenido: "" },
			],
		});
		expect(resultado).toEqual({ notas: 3, carpetas: 1 });
		expect(carpetaRepo.crear).toHaveBeenCalledTimes(1);
		expect(carpetaRepo.crear.mock.calls[0]?.[0].getDatos()).toMatchObject({
			nombre: "Europa",
			padreId: 1,
		});
		expect(notas.map((n) => n.getDatos().carpetaId)).toEqual([10, 10, null]);
		expect(notas[0]?.getDatos().contenido).toBe("[[Oporto]]");
	});

	it("rechaza un destino que no es del ámbito", async () => {
		const { useCase, notas } = preparar();
		await expect(
			useCase.ejecutar(USUARIO, {
				carpetaId: 99,
				notas: [{ carpeta: [], titulo: "x", contenido: "" }],
			}),
		).rejects.toThrow(CarpetaInvalidaError);
		expect(notas).toHaveLength(0);
	});
});
