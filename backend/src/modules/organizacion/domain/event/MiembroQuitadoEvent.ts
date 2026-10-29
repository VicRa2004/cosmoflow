import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

/** Salió (`expulsado: false`) o lo expulsó el admin. Quién lo hizo va en `meta`. */
export class MiembroQuitadoEvent implements DomainEvent {
	eventName = "organizacion.miembroQuitado";
	occurredOn = new Date();

	constructor(
		public readonly data: {
			organizacionId: number;
			usuarioId: number;
			expulsado: boolean;
		},
	) {}
}
