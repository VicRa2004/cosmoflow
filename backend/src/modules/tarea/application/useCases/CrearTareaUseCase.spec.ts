import { describe, expect, it, mock } from "bun:test";
import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import { Tarea } from "../../domain/Tarea";
import { CrearTareaUseCase } from "./CrearTareaUseCase";

const USUARIO = 7;

const repoCon = (tagsPropios: boolean) => ({
	sonTagsPropios: mock(async () => tagsPropios),
	crear: mock(async (t: Tarea) =>
		Tarea.reconstituir(1, t.getUsuarioId(), t.getDatos()),
	),
});

describe("CrearTareaUseCase", () => {
	it("crea la tarea del usuario sin consultar tags si no lleva", async () => {
		const repo = repoCon(true);
		const useCase = new CrearTareaUseCase(repo as never);

		const dto = await useCase.ejecutar(USUARIO, { titulo: "Demo" });

		expect(dto).toMatchObject({ id: 1, titulo: "Demo", estado: "pendiente" });
		expect(repo.crear.mock.calls[0]?.[0].getUsuarioId()).toBe(USUARIO);
		expect(repo.sonTagsPropios).not.toHaveBeenCalled();
	});

	it("rechaza tags que no son del usuario", async () => {
		const repo = repoCon(false);
		const useCase = new CrearTareaUseCase(repo as never);

		await expect(
			useCase.ejecutar(USUARIO, { titulo: "Demo", tagIds: [3] }),
		).rejects.toThrow(TagsAjenosError);
		expect(repo.sonTagsPropios).toHaveBeenCalledWith(USUARIO, [3]);
		expect(repo.crear).not.toHaveBeenCalled();
	});
});
