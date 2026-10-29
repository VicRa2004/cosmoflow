import type { DatosTarea, UbicacionTarea } from "../../domain/Tarea";

export interface TareaDto extends DatosTarea, UbicacionTarea {
	id: number;
	responsableIds: number[];
}
