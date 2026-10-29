import type { EstadoTarea, PrioridadTarea } from "../../domain/Tarea";

export interface CamposTareaDto {
	titulo: string;
	contenido?: string;
	estado?: EstadoTarea;
	prioridad?: PrioridadTarea;
	fechaInicio?: string | null;
	fechaVencimiento?: string | null;
	tagIds?: number[];
	/** Solo en las compartidas (RN-44). */
	responsableIds?: number[];
}

/** Sin `equipoId` ni `proyectoId`, personal. */
export interface CrearTareaDto extends CamposTareaDto {
	equipoId?: number;
	proyectoId?: number;
}
