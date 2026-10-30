import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

interface TareaEstadoCambiadoEventData {
	tareaId: number;
	/** Quien la creó: a quien se avisa del cambio. */
	creadorId: number;
	anterior: string;
	nuevo: string;
}

export class TareaEstadoCambiadoEvent implements DomainEvent {
	eventName = "tarea.estadoCambiado";
	occurredOn = new Date();

	constructor(public readonly data: TareaEstadoCambiadoEventData) {}
}
