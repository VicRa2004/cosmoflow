import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

/** Campos que se muestran en el historial; el estado va en `tarea.estadoCambiado`. */
export type CampoHistorial =
	| "titulo"
	| "prioridad"
	| "fechaInicio"
	| "fechaVencimiento";

interface TareaActualizadaEventData {
	tareaId: number;
	cambios: Partial<
		Record<CampoHistorial, { anterior: string | null; nuevo: string | null }>
	>;
}

/** Cambios de título, prioridad o fechas. Historial de actividad (#50). */
export class TareaActualizadaEvent implements DomainEvent {
	eventName = "tarea.actualizada";
	occurredOn = new Date();

	constructor(public readonly data: TareaActualizadaEventData) {}
}
