import { describe, expect, it, mock } from "bun:test";
import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import { TareaNoEncontradaError } from "../../domain/error/TareaNoEncontradaError";
import { Tarea } from "../../domain/Tarea";
import { ContextosTarea } from "../services/ContextosTarea";
import { ActualizarTareaUseCase } from "./ActualizarTareaUseCase";

const USUARIO = 7;
const OTRO = 8;

const personal = () =>
	Tarea.reconstituir(
		1,
		USUARIO,
		Tarea.crear(USUARIO, { titulo: "Demo" }).getDatos(),
	);
const deEquipo = () =>
	Tarea.reconstituir(
		1,
		OTRO,
		Tarea.crear(OTRO, { titulo: "Demo" }).getDatos(),
		{ organizacionId: 10, equipoId: 5, proyectoId: null },
	);

const preparar = (
	tarea: Tarea | null,
	{ tagsValidos = true, puedeCrear = true, esMiembro = true } = {},
) => {
	const repo = {
		buscarPorId: mock(async () => tarea),
		sonTagsDe: mock(async () => tagsValidos),
		actualizar: mock(async (t: Tarea) => t),
	};
	const equipos = {
		contexto: mock(async () =>
			esMiembro
				? { organizacionId: 10, miembroIds: [USUARIO, OTRO], puedeCrear }
				: null,
		),
	};
	return {
		repo,
		useCase: new ActualizarTareaUseCase(
			repo as never,
			new ContextosTarea(
				equipos,
				{ contexto: mock(async () => null) },
				{ contexto: mock(async () => null) },
			),
		),
	};
};

describe("ActualizarTareaUseCase", () => {
	it("actualiza solo los campos enviados", async () => {
		const { useCase } = preparar(personal());
		const dto = await useCase.ejecutar(USUARIO, 1, { estado: "completada" });
		expect(dto).toMatchObject({ titulo: "Demo", estado: "completada" });
	});

	it("rechaza tags que no son del usuario", async () => {
		const { repo, useCase } = preparar(personal(), { tagsValidos: false });
		await expect(useCase.ejecutar(USUARIO, 1, { tagIds: [3] })).rejects.toThrow(
			TagsAjenosError,
		);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});

	it("la personal de otro usuario no existe para quien pide", async () => {
		const { useCase } = preparar(personal());
		await expect(useCase.ejecutar(OTRO, 1, { titulo: "x" })).rejects.toThrow(
			TareaNoEncontradaError,
		);
	});

	it("lanza TareaNoEncontradaError si no existe", async () => {
		const { repo, useCase } = preparar(null);
		await expect(
			useCase.ejecutar(USUARIO, 999, { titulo: "x" }),
		).rejects.toThrow(TareaNoEncontradaError);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});

	it("un miembro del equipo la edita aunque no la creó", async () => {
		const { useCase } = preparar(deEquipo(), { puedeCrear: false });
		const dto = await useCase.ejecutar(USUARIO, 1, { estado: "en_progreso" });
		expect(dto.estado).toBe("en_progreso");
	});

	it("cambiar responsables exige ser líder o delegado (RN-22)", async () => {
		const { useCase } = preparar(deEquipo(), { puedeCrear: false });
		await expect(
			useCase.ejecutar(USUARIO, 1, { responsableIds: [USUARIO] }),
		).rejects.toThrow(SinPermisoTareasError);
	});

	it("quien ya no es miembro del equipo no la ve", async () => {
		const { useCase } = preparar(deEquipo(), { esMiembro: false });
		await expect(useCase.ejecutar(USUARIO, 1, { titulo: "x" })).rejects.toThrow(
			TareaNoEncontradaError,
		);
	});
});
