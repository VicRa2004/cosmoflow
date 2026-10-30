import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

interface ResponsablesAsignadosEventData {
	tareaId: number;
	/** Solo los responsables nuevos, no los que ya estaban. */
	usuarioIds: number[];
}

export class ResponsablesAsignadosEvent implements DomainEvent {
	eventName = "tarea.responsablesAsignados";
	occurredOn = new Date();

	constructor(public readonly data: ResponsablesAsignadosEventData) {}
}
