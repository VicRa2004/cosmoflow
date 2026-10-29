import { describe, expect, it, mock } from "bun:test";
import type { PermisoOrganizacion } from "@/modules/organizacion";
import { Equipo } from "../../domain/Equipo";
import { SinPermisoDelegadosError } from "../../domain/error/SinPermisoDelegadosError";
import { CambiarDelegadosUseCase } from "./CambiarDelegadosUseCase";

const LIDER = 1;
const MIEMBRO = 2;

const preparar = (permisos: PermisoOrganizacion[] = []) => {
	const equipo = Equipo.reconstituir(5, 10, {
		nombre: "Plataforma",
		descripcion: "",
		color: "#6366f1",
		liderId: LIDER,
		miembros: [
			{ usuarioId: LIDER, puedeCrearTareas: false },
			{ usuarioId: MIEMBRO, puedeCrearTareas: false },
		],
		tagIds: [],
	});
	const repo = {
		buscarPorId: mock(async () => equipo),
		actualizar: mock(async (e: Equipo) => e),
	};
	const acceso = { exigir: mock(async () => permisos) };
	return {
		repo,
		useCase: new CambiarDelegadosUseCase(repo as never, acceso),
	};
};

describe("CambiarDelegadosUseCase", () => {
	it("el líder elige a sus delegados", async () => {
		const { useCase } = preparar();
		const dto = await useCase.ejecutar(
			{ usuarioId: LIDER, organizacionId: 10 },
			5,
			[MIEMBRO],
		);
		expect(dto.miembros).toContainEqual({
			usuarioId: MIEMBRO,
			puedeCrearTareas: true,
		});
	});

	it("un miembro que no es líder ni tiene equipos:editar no puede", async () => {
		const { useCase, repo } = preparar();
		expect(
			useCase.ejecutar({ usuarioId: MIEMBRO, organizacionId: 10 }, 5, [
				MIEMBRO,
			]),
		).rejects.toThrow(SinPermisoDelegadosError);
		expect(repo.actualizar).not.toHaveBeenCalled();
	});

	it("con equipos:editar también puede", async () => {
		const { useCase, repo } = preparar(["equipos:editar"]);
		await useCase.ejecutar({ usuarioId: MIEMBRO, organizacionId: 10 }, 5, []);
		expect(repo.actualizar).toHaveBeenCalled();
	});
});
