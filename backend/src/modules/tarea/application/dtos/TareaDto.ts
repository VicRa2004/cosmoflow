import type { DatosTarea, UbicacionTarea } from "../../domain/Tarea";

export interface TareaDto extends DatosTarea, UbicacionTarea {
	id: number;
	responsableIds: number[];
	/** Depende de una tarea aún sin completar: no se puede empezar ni completar. */
	bloqueada: boolean;
}
