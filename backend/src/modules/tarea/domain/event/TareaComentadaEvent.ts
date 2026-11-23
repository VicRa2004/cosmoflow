import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

interface TareaComentadaEventData {
	tareaId: number;
	comentarioId: number;
	autorId: number;
	/** Mencionados con acceso a la tarea, sin el autor. */
	mencionIds: number[];
	/** Autor del comentario al que se respondió (si es respuesta y no es el mismo autor). */
	respondeAAutorId?: number | null;
}

export class TareaComentadaEvent implements DomainEvent {
	eventName = "tarea.comentada";
	occurredOn = new Date();

	constructor(public readonly data: TareaComentadaEventData) {}
}
