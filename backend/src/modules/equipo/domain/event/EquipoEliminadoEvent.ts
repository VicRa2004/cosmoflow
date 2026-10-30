import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

interface EquipoEliminadoEventData {
	organizacionId: number;
	equipoId: number;
}

/** Sus tareas y adjuntos pasan a la organización. */
export class EquipoEliminadoEvent implements DomainEvent {
	eventName = "equipo.eliminado";
	occurredOn = new Date();

	constructor(public readonly data: EquipoEliminadoEventData) {}
}
