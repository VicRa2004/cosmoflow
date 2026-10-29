import { ProyectoNoEncontradoError } from "../../domain/error/ProyectoNoEncontradoError";
import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";

export async function buscarProyecto(
	repo: ProyectoRepository,
	organizacionId: number,
	id: number,
) {
	const proyecto = await repo.buscarPorId(organizacionId, id);
	if (!proyecto) throw new ProyectoNoEncontradoError();
	return proyecto;
}
