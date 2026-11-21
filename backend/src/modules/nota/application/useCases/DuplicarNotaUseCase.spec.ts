import { describe, expect, it, mock } from "bun:test";
import { Nota } from "../../domain/Nota";
import { ProyectosNota } from "../services/ProyectosNota";
import { DuplicarNotaUseCase } from "./DuplicarNotaUseCase";

const USUARIO = 7;

describe("DuplicarNotaUseCase", () => {
	it("clona una nota en su carpeta y proyecto sin fijar", async () => {
		const original = Nota.reconstituir(
			4,
			USUARIO,
			{
				titulo: "Arquitectura",
				contenido: "## Capas",
				color: "#10b981",
				isFijada: true,
				tagIds: [2, 5],
				carpetaId: 9,
			},
			new Date(),
			{ organizacionId: 10, proyectoId: 3 },
		);
		const repo = {
			buscarPorId: mock(async () => original),
			crear: mock(async (n: Nota) =>
				Nota.reconstituir(
					5,
					n.getUsuarioId(),
					n.getDatos(),
					new Date(),
					n.getProyecto(),
				),
			),
		};
		const proyectos = {
			contexto: mock(async () => ({
				organizacionId: 10,
				miembroIds: [USUARIO],
				puedeCrear: true,
			})),
		};

		const useCase = new DuplicarNotaUseCase(
			repo as never,
			new ProyectosNota(repo as never, proyectos),
		);

		const copia = await useCase.ejecutar(USUARIO, 4);

		expect(copia).toMatchObject({
			id: 5,
			titulo: "Arquitectura (copia)",
			contenido: "## Capas",
			color: "#10b981",
			isFijada: false,
			tagIds: [2, 5],
			carpetaId: 9,
			organizacionId: 10,
			proyectoId: 3,
		});
	});
});
