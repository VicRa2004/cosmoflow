import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

/** Desde la papelera. Historial de actividad (#50). */
export class TareaRestauradaEvent implements DomainEvent {
	eventName = "tarea.restaurada";
	occurredOn = new Date();

	constructor(public readonly data: { tareaId: number }) {}
}
