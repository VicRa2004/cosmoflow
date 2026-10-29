import type { DestinoTarea } from "../../domain/Tarea";

/**
 * `equipoId`, `proyectoId` u `organizacionId` (la organización sin equipo ni proyecto)
 * del cuerpo o la query; `null` si no trae ninguno.
 */
export const destinoDe = ({
	organizacionId,
	equipoId,
	proyectoId,
}: {
	organizacionId?: number;
	equipoId?: number;
	proyectoId?: number;
}): DestinoTarea | null =>
	equipoId
		? { equipoId }
		: proyectoId
			? { proyectoId }
			: organizacionId
				? { organizacionId }
				: null;
