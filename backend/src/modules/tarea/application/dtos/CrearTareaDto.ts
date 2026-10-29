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

/** Sin destino, personal; `organizacionId` solo, de la organización sin equipo ni proyecto. */
export interface CrearTareaDto extends CamposTareaDto {
	organizacionId?: number;
	equipoId?: number;
	proyectoId?: number;
}
