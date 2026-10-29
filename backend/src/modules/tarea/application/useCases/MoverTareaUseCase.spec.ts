import { describe, expect, it, mock } from "bun:test";
import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import { TareaInvalidaError } from "../../domain/error/TareaInvalidaError";
import { Tarea } from "../../domain/Tarea";
import { ContextosTarea } from "../services/ContextosTarea";
import { MoverTareaUseCase } from "./MoverTareaUseCase";

const USUARIO = 7;

const preparar = (tarea: Tarea, puedeCrear = true) => {
	const repo = {
		buscarPorId: mock(async () => tarea),
		actualizar: mock(async (t: Tarea) => t),
	};
	const equipos = {
		contexto: mock(async () => ({
			organizacionId: 10,
			miembroIds: [USUARIO],
			puedeCrear,
		})),
	};
	const adjuntos = { compartir: mock(async () => {}) };
	return {
		repo,
		adjuntos,
		useCase: new MoverTareaUseCase(
			repo as never,
			new ContextosTarea(equipos, { contexto: mock(async () => null) }),
			adjuntos,
		),
	};
};

const personal = () =>
	Tarea.reconstituir(1, USUARIO, {
		...Tarea.crear(USUARIO, { titulo: "Demo" }).getDatos(),
		contenido: "Mira ![](/api/adjuntos/12) y ![](/api/adjuntos/13)",
		tagIds: [3],
	});

describe("MoverTareaUseCase", () => {
	it("mueve una personal a un equipo y suelta sus tags personales (RN-45)", async () => {
		const { useCase } = preparar(personal());
		const dto = await useCase.ejecutar(USUARIO, 1, { equipoId: 5 });
		expect(dto).toMatchObject({ organizacionId: 10, equipoId: 5, tagIds: [] });
	});

	it("sus imágenes pasan a verse en el destino", async () => {
		const { useCase, adjuntos } = preparar(personal());
		await useCase.ejecutar(USUARIO, 1, { equipoId: 5 });
		expect(adjuntos.compartir).toHaveBeenCalledWith(USUARIO, [12, 13], {
			equipoId: 5,
		});
	});

	it("con líder, solo si es líder o delegado", async () => {
		const { useCase, repo } = preparar(personal(), false);
		await expect(useCase.ejecutar(USUARIO, 1, { equipoId: 5 })).rejects.toThrow(
			SinPermisoTareasError,
		);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});

	it("una de equipo no se mueve ni vuelve a personal", async () => {
		const compartida = Tarea.reconstituir(
			1,
			USUARIO,
			Tarea.crear(USUARIO, { titulo: "Demo" }).getDatos(),
			{ organizacionId: 10, equipoId: 5, proyectoId: null },
		);
		const { useCase } = preparar(compartida);
		await expect(
			useCase.ejecutar(USUARIO, 1, { proyectoId: 2 }),
		).rejects.toThrow(TareaInvalidaError);
	});
});
