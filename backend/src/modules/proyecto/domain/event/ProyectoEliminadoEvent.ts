import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

interface ProyectoEliminadoEventData {
	organizacionId: number;
	proyectoId: number;
}

/** Sus tareas y adjuntos pasan a la organización; sus notas, a quien las creó. */
export class ProyectoEliminadoEvent implements DomainEvent {
	eventName = "proyecto.eliminado";
	occurredOn = new Date();

	constructor(public readonly data: ProyectoEliminadoEventData) {}
}
