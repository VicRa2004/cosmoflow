import type { EstadoTarea, PrioridadTarea } from "../../domain/Tarea";

export type AccionLoteTareasDto =
	| { ids: number[]; accion: "estado"; estado: EstadoTarea }
	| { ids: number[]; accion: "prioridad"; prioridad: PrioridadTarea }
	| { ids: number[]; accion: "agregar_tag"; tagId: number }
	| { ids: number[]; accion: "quitar_tag"; tagId: number };

export interface ResultadoLoteTareasDto {
	afectadas: number;
}
