import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import { TareaInvalidaError } from "../../domain/error/TareaInvalidaError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { Tarea } from "../../domain/Tarea";
import type { ContextoTarea } from "../services/ContextosTarea";

/**
 * Tags del dueño (personal) o de la organización (compartida), RN-60; responsables
 * entre los miembros de la organización, equipo o proyecto (RN-23).
 */
export async function validarTarea(
	repo: TareaRepository,
	tarea: Tarea,
	contexto: ContextoTarea | null,
): Promise<void> {
	const { tagIds } = tarea.getDatos();
	const dueno = contexto
		? { organizacionId: contexto.organizacionId }
		: { usuarioId: tarea.getUsuarioId() };
	if (tagIds.length > 0 && !(await repo.sonTagsDe(dueno, tagIds))) {
		throw new TagsAjenosError();
	}
	if (
		tarea.getResponsableIds().some((id) => !contexto?.miembroIds.includes(id))
	) {
		throw new TareaInvalidaError(
			"Los responsables deben ser miembros del destino de la tarea",
		);
	}
}
