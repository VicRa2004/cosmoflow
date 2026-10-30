import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

interface ProyectoActualizadoEventData {
	organizacionId: number;
	proyectoId: number;
}

/** Pueden haber cambiado sus equipos o integrantes: se depuran los responsables de sus tareas. */
export class ProyectoActualizadoEvent implements DomainEvent {
	eventName = "proyecto.actualizado";
	occurredOn = new Date();

	constructor(public readonly data: ProyectoActualizadoEventData) {}
}
