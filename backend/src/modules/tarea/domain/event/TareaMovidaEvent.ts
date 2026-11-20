import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

interface TareaMovidaEventData {
	tareaId: number;
	organizacionId: number;
	equipoId: number | null;
	proyectoId: number | null;
}

/** De personal a una organización, equipo o proyecto (RN-45). Historial (#50). */
export class TareaMovidaEvent implements DomainEvent {
	eventName = "tarea.movida";
	occurredOn = new Date();

	constructor(public readonly data: TareaMovidaEventData) {}
}
