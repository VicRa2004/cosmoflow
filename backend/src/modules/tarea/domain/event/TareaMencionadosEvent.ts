import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

interface TareaMencionadosEventData {
	tareaId: number;
	/** Solo los mencionados nuevos, no los que ya estaban. */
	usuarioIds: number[];
}

export class TareaMencionadosEvent implements DomainEvent {
	eventName = "tarea.mencionados";
	occurredOn = new Date();

	constructor(public readonly data: TareaMencionadosEventData) {}
}
