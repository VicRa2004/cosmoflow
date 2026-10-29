import type { DestinoTarea } from "../../domain/Tarea";

/** `equipoId` o `proyectoId` del cuerpo o la query; `null` si no trae ninguno. */
export const destinoDe = ({
	equipoId,
	proyectoId,
}: {
	equipoId?: number;
	proyectoId?: number;
}): DestinoTarea | null =>
	equipoId ? { equipoId } : proyectoId ? { proyectoId } : null;
