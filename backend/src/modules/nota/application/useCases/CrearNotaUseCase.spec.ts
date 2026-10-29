import { describe, expect, it, mock } from "bun:test";
import { ProyectoNoEncontradoError } from "../../domain/error/ProyectoNoEncontradoError";
import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import { Nota } from "../../domain/Nota";
import { ProyectosNota } from "../services/ProyectosNota";
import { CrearNotaUseCase } from "./CrearNotaUseCase";

const USUARIO = 7;

const preparar = ({ tagsValidos = true, esMiembro = true } = {}) => {
	const repo = {
		sonTagsDe: mock(async () => tagsValidos),
		crear: mock(async (n: Nota) =>
			Nota.reconstituir(
				1,
				n.getUsuarioId(),
				n.getDatos(),
				new Date(),
				n.getProyecto(),
			),
		),
	};
	const proyectos = {
		contexto: mock(async () =>
			esMiembro
				? { organizacionId: 10, miembroIds: [], puedeCrear: true }
				: null,
		),
	};
	return {
		repo,
		useCase: new CrearNotaUseCase(
			repo as never,
			new ProyectosNota(repo as never, proyectos),
		),
	};
};

describe("CrearNotaUseCase", () => {
	it("crea la nota del usuario con contenido vacío por defecto", async () => {
		const { useCase, repo } = preparar();
		const dto = await useCase.ejecutar(USUARIO, { titulo: "Ideas" });
		expect(dto).toMatchObject({ id: 1, titulo: "Ideas", contenido: "" });
		expect(repo.sonTagsDe).not.toHaveBeenCalled();
	});

	it("rechaza tags que no son del usuario", async () => {
		const { useCase, repo } = preparar({ tagsValidos: false });
		await expect(
			useCase.ejecutar(USUARIO, { titulo: "Ideas", tagIds: [3] }),
		).rejects.toThrow(TagsAjenosError);
		expect(repo.sonTagsDe).toHaveBeenCalledWith({ usuarioId: USUARIO }, [3]);
		expect(repo.crear).not.toHaveBeenCalled();
	});

	it("en un proyecto usa los tags de su organización (RN-60)", async () => {
		const { useCase, repo } = preparar();
		const dto = await useCase.ejecutar(USUARIO, {
			titulo: "Acta",
			proyectoId: 4,
			tagIds: [3],
		});
		expect(dto).toMatchObject({ organizacionId: 10, proyectoId: 4 });
		expect(repo.sonTagsDe).toHaveBeenCalledWith({ organizacionId: 10 }, [3]);
	});

	it("en un proyecto ajeno no existe (RN-90)", async () => {
		const { useCase, repo } = preparar({ esMiembro: false });
		await expect(
			useCase.ejecutar(USUARIO, { titulo: "Acta", proyectoId: 4 }),
		).rejects.toThrow(ProyectoNoEncontradoError);
		expect(repo.crear).not.toHaveBeenCalled();
	});
});
