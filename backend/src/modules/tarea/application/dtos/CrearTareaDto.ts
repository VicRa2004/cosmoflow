import type {
	EstadoTarea,
	PrioridadTarea,
	RecurrenciaTarea,
} from "../../domain/Tarea";

export interface SubtareaInputDto {
	/** Al actualizar: la subtarea existente que se edita (conserva su id). */
	id?: number;
	titulo: string;
	completada?: boolean;
}

export interface CamposTareaDto {
	titulo: string;
	contenido?: string;
	estado?: EstadoTarea;
	prioridad?: PrioridadTarea;
	fechaInicio?: string | null;
	fechaVencimiento?: string | null;
	color?: string | null;
	isFijada?: boolean;
	tagIds?: number[];
	dependeDeId?: number | null;
	recurrencia?: RecurrenciaTarea | null;
	subtareas?: SubtareaInputDto[];
	/** Solo en las compartidas (RN-44). */
	responsableIds?: number[];
}

/** Sin destino, personal; `organizacionId` solo, de la organización sin equipo ni proyecto. */
export interface CrearTareaDto extends CamposTareaDto {
	organizacionId?: number;
	equipoId?: number;
	proyectoId?: number;
}
