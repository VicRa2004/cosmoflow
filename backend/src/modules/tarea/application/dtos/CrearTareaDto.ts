import type { EstadoTarea, PrioridadTarea } from "../../domain/Tarea";

export interface CrearTareaDto {
	titulo: string;
	contenido?: string;
	estado?: EstadoTarea;
	prioridad?: PrioridadTarea;
	fechaInicio?: string | null;
	fechaVencimiento?: string | null;
	tagIds?: number[];
}
