import { EquipoNoEncontradoError } from "../../domain/error/EquipoNoEncontradoError";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";

export async function buscarEquipo(
	repo: EquipoRepository,
	organizacionId: number,
	id: number,
) {
	const equipo = await repo.buscarPorId(organizacionId, id);
	if (!equipo) throw new EquipoNoEncontradoError();
	return equipo;
}
