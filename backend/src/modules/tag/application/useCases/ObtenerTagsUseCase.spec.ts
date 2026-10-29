import { describe, expect, it, mock } from "bun:test";
import { ObtenerTagsUseCase } from "./ObtenerTagsUseCase";
import { Tag } from "../../domain/Tag";

describe("ObtenerTagsUseCase", () => {
	it("debería devolver la página mapeada a DTOs", async () => {
		const repo = {
			buscar: mock(async () => ({
				datos: [Tag.reconstituir(1, 7, "Ejemplo")],
				pagina: 1,
				totalElementos: 1,
				totalPaginas: 1,
			})),
		};
		const useCase = new ObtenerTagsUseCase(repo as never);

		const result = await useCase.ejecutar(7, { pagina: 1, limite: 10 });

		expect(result.datos).toEqual([{ id: 1, nombre: "Ejemplo" }]);
		expect(result.totalElementos).toBe(1);
	});
});
