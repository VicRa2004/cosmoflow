import { describe, expect, it, mock } from "bun:test";
import { ObtenerTagsUseCase } from "./ObtenerTagsUseCase";
import { Tag } from "../../domain/Tag";

/** Los tags personales no consultan la organización. */
const acceso = { exigir: mock(async () => []) };

describe("ObtenerTagsUseCase", () => {
	it("debería devolver la página mapeada a DTOs", async () => {
		const repo = {
			buscar: mock(async () => ({
				datos: [Tag.reconstituir(1, { usuarioId: 7 }, "Ejemplo")],
				pagina: 1,
				totalElementos: 1,
				totalPaginas: 1,
			})),
		};
		const useCase = new ObtenerTagsUseCase(repo as never, acceso);

		const result = await useCase.ejecutar(
			{ usuarioId: 7 },
			{ pagina: 1, limite: 10 },
		);

		expect(result.datos).toEqual([{ id: 1, nombre: "Ejemplo" }]);
		expect(result.totalElementos).toBe(1);
	});
});
