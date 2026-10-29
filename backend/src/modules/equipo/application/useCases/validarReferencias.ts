import { EquipoInvalidoError } from "../../domain/error/EquipoInvalidoError";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";

/** Miembros y tags tienen que ser de la misma organización (RN-20, RN-60). */
export async function validarReferencias(
	repo: EquipoRepository,
	organizacionId: number,
	{ miembroIds, tagIds }: { miembroIds?: number[]; tagIds?: number[] },
): Promise<void> {
	if (miembroIds && !(await repo.sonMiembros(organizacionId, miembroIds))) {
		throw new EquipoInvalidoError(
			"Todos los miembros deben pertenecer a la organización",
		);
	}
	if (tagIds && !(await repo.sonTags(organizacionId, tagIds))) {
		throw new EquipoInvalidoError("Los tags deben ser de la organización");
	}
}
