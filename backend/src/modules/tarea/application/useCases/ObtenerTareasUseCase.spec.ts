import { describe, expect, it, mock } from "bun:test";
import { ObtenerTareasUseCase } from "./ObtenerTareasUseCase";
import { Tarea } from "../../domain/Tarea";

describe("ObtenerTareasUseCase", () => {
	it("debería devolver la página mapeada a DTOs", async () => {
		const repo = {
			buscar: mock(async () => ({
				datos: [
					Tarea.reconstituir(
						1,
						7,
						Tarea.crear(7, { titulo: "Ejemplo" }).getDatos(),
					),
				],
				pagina: 1,
				totalElementos: 1,
				totalPaginas: 1,
			})),
		};
		const useCase = new ObtenerTareasUseCase(repo as never);

		const result = await useCase.ejecutar(7, { pagina: 1, limite: 10 });

		expect(result.datos).toMatchObject([{ titulo: "Ejemplo" }]);
		expect(result.totalElementos).toBe(1);
	});

	it("con `asignadas`, busca aquellas en las que es responsable", async () => {
		const repo = {
			buscar: mock(async () => ({
				datos: [],
				pagina: 1,
				totalElementos: 0,
				totalPaginas: 0,
			})),
		};
		const useCase = new ObtenerTareasUseCase(repo as never, {} as never);

		await useCase.ejecutar(7, { pagina: 1, limite: 10, asignadas: true });

		expect(repo.buscar).toHaveBeenCalledWith(
			{ responsableId: 7 },
			{ pagina: 1, limite: 10 },
		);
	});
});
