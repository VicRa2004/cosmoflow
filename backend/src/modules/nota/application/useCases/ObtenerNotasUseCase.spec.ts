import { describe, expect, it, mock } from "bun:test";
import { ObtenerNotasUseCase } from "./ObtenerNotasUseCase";
import { Nota } from "../../domain/Nota";
import { ProyectosNota } from "../services/ProyectosNota";

describe("ObtenerNotasUseCase", () => {
	it("debería devolver la página mapeada a DTOs", async () => {
		const repo = {
			buscar: mock(async () => ({
				datos: [
					Nota.reconstituir(
						1,
						7,
						{ titulo: "Ejemplo", contenido: "", tagIds: [] },
						new Date(),
					),
				],
				pagina: 1,
				totalElementos: 1,
				totalPaginas: 1,
			})),
		};
		const useCase = new ObtenerNotasUseCase(
			repo as never,
			new ProyectosNota(repo as never, { contexto: mock(async () => null) }),
		);

		const result = await useCase.ejecutar(7, { pagina: 1, limite: 10 });

		expect(result.datos).toMatchObject([{ titulo: "Ejemplo" }]);
		expect(result.totalElementos).toBe(1);
		expect(repo.buscar).toHaveBeenCalledWith(
			{ usuarioId: 7 },
			{ pagina: 1, limite: 10 },
		);
	});
});
