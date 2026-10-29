import { ProyectoInvalidoError } from "../../domain/error/ProyectoInvalidoError";
import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";

/** Equipos e integrantes tienen que ser de la misma organización (RN-30, RN-32). */
export async function validarReferencias(
	repo: ProyectoRepository,
	organizacionId: number,
	{
		equipoIds,
		integranteIds,
	}: { equipoIds?: number[]; integranteIds?: number[] },
): Promise<void> {
	if (equipoIds && !(await repo.sonEquipos(organizacionId, equipoIds))) {
		throw new ProyectoInvalidoError("Los equipos deben ser de la organización");
	}
	if (
		integranteIds &&
		!(await repo.sonMiembros(organizacionId, integranteIds))
	) {
		throw new ProyectoInvalidoError(
			"Los integrantes deben pertenecer a la organización",
		);
	}
}
