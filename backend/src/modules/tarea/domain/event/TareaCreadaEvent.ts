import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

/** Historial de actividad (#50). */
export class TareaCreadaEvent implements DomainEvent {
	eventName = "tarea.creada";
	occurredOn = new Date();

	constructor(public readonly data: { tareaId: number }) {}
}
