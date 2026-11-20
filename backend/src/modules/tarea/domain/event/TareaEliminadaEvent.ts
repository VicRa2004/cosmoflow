import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

/** A la papelera. Historial de actividad (#50). */
export class TareaEliminadaEvent implements DomainEvent {
	eventName = "tarea.eliminada";
	occurredOn = new Date();

	constructor(public readonly data: { tareaId: number }) {}
}
