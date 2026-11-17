import type { DatosTarea, UbicacionTarea } from "../../domain/Tarea";

export interface TareaDto extends DatosTarea, UbicacionTarea {
	id: number;
	responsableIds: number[];
	/** Responsable → quien lo asignó; sin entrada en las asignaciones antiguas. */
	asignadoPor: Record<number, number>;
	/** Depende de una tarea aún sin completar: no se puede empezar ni completar. */
	bloqueada: boolean;
}
