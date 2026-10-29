import { describe, expect, it, mock } from "bun:test";
import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import { Nota } from "../../domain/Nota";
import { CrearNotaUseCase } from "./CrearNotaUseCase";

const USUARIO = 7;
const AHORA = new Date("2026-10-28T10:00:00Z");

const repoCon = (tagsPropios: boolean) => ({
	sonTagsPropios: mock(async () => tagsPropios),
	crear: mock(async (n: Nota) =>
		Nota.reconstituir(1, n.getUsuarioId(), n.getDatos(), AHORA),
	),
});

describe("CrearNotaUseCase", () => {
	it("crea la nota del usuario con contenido vacío por defecto", async () => {
		const repo = repoCon(true);
		const useCase = new CrearNotaUseCase(repo as never);

		expect(await useCase.ejecutar(USUARIO, { titulo: "Ideas" })).toEqual({
			id: 1,
			titulo: "Ideas",
			contenido: "",
			tagIds: [],
			updatedAt: AHORA.toISOString(),
		});
		expect(repo.crear.mock.calls[0]?.[0].getUsuarioId()).toBe(USUARIO);
		expect(repo.sonTagsPropios).not.toHaveBeenCalled();
	});

	it("rechaza tags que no son del usuario", async () => {
		const repo = repoCon(false);
		const useCase = new CrearNotaUseCase(repo as never);

		await expect(
			useCase.ejecutar(USUARIO, { titulo: "Ideas", tagIds: [3] }),
		).rejects.toThrow(TagsAjenosError);
		expect(repo.crear).not.toHaveBeenCalled();
	});
});
