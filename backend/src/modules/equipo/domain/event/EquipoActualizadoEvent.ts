import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

interface EquipoActualizadoEventData {
	organizacionId: number;
	equipoId: number;
}

/** Pueden haber cambiado sus miembros: se depuran los responsables de sus tareas. */
export class EquipoActualizadoEvent implements DomainEvent {
	eventName = "equipo.actualizado";
	occurredOn = new Date();

	constructor(public readonly data: EquipoActualizadoEventData) {}
}
