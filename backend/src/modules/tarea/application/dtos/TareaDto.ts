import type { DatosTarea, UbicacionTarea } from "../../domain/Tarea";

export interface SubtareaDto {
	id: number;
	titulo: string;
	completada: boolean;
}

export interface TareaDto
	extends Omit<DatosTarea, "subtareas">,
		UbicacionTarea {
	id: number;
	subtareas: SubtareaDto[];
	responsableIds: number[];
	/** Responsable → quien lo asignó; sin entrada en las asignaciones antiguas. */
	asignadoPor: Record<number, number>;
	/** Depende de una tarea aún sin completar: no se puede empezar ni completar. */
	bloqueada: boolean;
}
