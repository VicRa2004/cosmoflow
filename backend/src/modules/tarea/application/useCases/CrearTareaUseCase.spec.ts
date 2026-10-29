import { describe, expect, it, mock } from "bun:test";
import { ContextoNoEncontradoError } from "../../domain/error/ContextoNoEncontradoError";
import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import { TareaInvalidaError } from "../../domain/error/TareaInvalidaError";
import { Tarea } from "../../domain/Tarea";
import { ContextosTarea } from "../services/ContextosTarea";
import { CrearTareaUseCase } from "./CrearTareaUseCase";

const USUARIO = 7;
const EQUIPO = 5;

const preparar = ({
	tagsValidos = true,
	puedeCrear = true,
	esMiembro = true,
} = {}) => {
	const repo = {
		sonTagsDe: mock(async () => tagsValidos),
		crear: mock(async (t: Tarea) =>
			Tarea.reconstituir(1, t.getUsuarioId(), t.getDatos(), t.getUbicacion(), [
				...t.getResponsableIds(),
			]),
		),
	};
	const equipos = {
		contexto: mock(async () =>
			esMiembro
				? { organizacionId: 10, miembroIds: [USUARIO, 8], puedeCrear }
				: null,
		),
	};
	const proyectos = { contexto: mock(async () => null) };
	return {
		repo,
		useCase: new CrearTareaUseCase(
			repo as never,
			new ContextosTarea(equipos, proyectos),
		),
	};
};

describe("CrearTareaUseCase", () => {
	it("crea la tarea personal sin consultar tags si no lleva", async () => {
		const { repo, useCase } = preparar();
		const tarea = await useCase.ejecutar(USUARIO, { titulo: "Demo" });
		expect(tarea).toMatchObject({
			titulo: "Demo",
			estado: "pendiente",
			organizacionId: null,
			equipoId: null,
		});
		expect(repo.sonTagsDe).not.toHaveBeenCalled();
	});

	it("rechaza tags que no son del usuario", async () => {
		const { repo, useCase } = preparar({ tagsValidos: false });
		await expect(
			useCase.ejecutar(USUARIO, { titulo: "Demo", tagIds: [3] }),
		).rejects.toThrow(TagsAjenosError);
		expect(repo.sonTagsDe).toHaveBeenCalledWith({ usuarioId: USUARIO }, [3]);
		expect(repo.crear).not.toHaveBeenCalled();
	});

	it("una personal no tiene responsables", async () => {
		const { useCase } = preparar();
		await expect(
			useCase.ejecutar(USUARIO, { titulo: "Demo", responsableIds: [8] }),
		).rejects.toThrow(TareaInvalidaError);
	});

	it("en un equipo usa los tags de la organización y asigna a sus miembros", async () => {
		const { repo, useCase } = preparar();
		const tarea = await useCase.ejecutar(USUARIO, {
			titulo: "Demo",
			equipoId: EQUIPO,
			tagIds: [3],
			responsableIds: [8],
		});
		expect(tarea).toMatchObject({
			organizacionId: 10,
			equipoId: EQUIPO,
			responsableIds: [8],
		});
		expect(repo.sonTagsDe).toHaveBeenCalledWith({ organizacionId: 10 }, [3]);
	});

	it("los responsables tienen que ser del equipo (RN-23)", async () => {
		const { useCase } = preparar();
		await expect(
			useCase.ejecutar(USUARIO, {
				titulo: "Demo",
				equipoId: EQUIPO,
				responsableIds: [99],
			}),
		).rejects.toThrow("miembros del equipo o proyecto");
	});

	it("con líder, quien no es líder ni delegado no crea (RN-22)", async () => {
		const { repo, useCase } = preparar({ puedeCrear: false });
		await expect(
			useCase.ejecutar(USUARIO, { titulo: "Demo", equipoId: EQUIPO }),
		).rejects.toThrow(SinPermisoTareasError);
		expect(repo.crear).not.toHaveBeenCalled();
	});

	it("en un equipo ajeno no existe (RN-90)", async () => {
		const { useCase } = preparar({ esMiembro: false });
		await expect(
			useCase.ejecutar(USUARIO, { titulo: "Demo", equipoId: EQUIPO }),
		).rejects.toThrow(ContextoNoEncontradoError);
	});
});
