import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import { TareaInvalidaError } from "../../domain/error/TareaInvalidaError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { DatosTarea, Tarea } from "../../domain/Tarea";
import type { ContextoTarea } from "../services/ContextosTarea";

/**
 * Tags del dueño (personal) o de la organización (compartida), RN-60; responsables
 * entre los miembros de la organización, equipo o proyecto (RN-23).
 */
export async function validarTarea(
	repo: TareaRepository,
	tarea: Tarea,
	contexto: ContextoTarea | null,
	/** Sus datos antes de editarla; sin ellos, es nueva. */
	antes?: DatosTarea,
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
	await validarDependencia(repo, tarea, antes);
}

const MAX_CADENA = 100;

/**
 * La principal debe ser del mismo sitio y sin ciclos. Solo se empieza o completa
 * con la principal completada (si se borró, ya no bloquea).
 */
async function validarDependencia(
	repo: TareaRepository,
	tarea: Tarea,
	antes?: DatosTarea,
): Promise<void> {
	const { dependeDeId, estado } = tarea.getDatos();
	if (dependeDeId === null) return;
	const cambiaDependencia = dependeDeId !== antes?.dependeDeId;
	const empieza =
		estado !== antes?.estado &&
		(estado === "en_progreso" || estado === "completada");
	if (!cambiaDependencia && !empieza) return;

	const principal = await repo.buscarPorId(dependeDeId);
	if (cambiaDependencia) {
		if (!principal || !tarea.mismoSitioQue(principal)) {
			throw new TareaInvalidaError(
				"Solo puede depender de otra tarea del mismo sitio",
			);
		}
		// Sube por la cadena de principales: si llega a ella misma, sería un ciclo.
		const id = antes ? tarea.getId() : null;
		let actual: Tarea | null = principal;
		for (let i = 0; actual && id !== null && i < MAX_CADENA; i++) {
			if (actual.getId() === id) {
				throw new TareaInvalidaError(
					"Una tarea no puede depender de sí misma ni de sus dependientes",
				);
			}
			const siguiente: number | null = actual.getDatos().dependeDeId;
			actual = siguiente === null ? null : await repo.buscarPorId(siguiente);
		}
	}
	if (empieza && principal && principal.getDatos().estado !== "completada") {
		throw new TareaInvalidaError(
			`Primero hay que completar «${principal.getDatos().titulo}»`,
		);
	}
}
