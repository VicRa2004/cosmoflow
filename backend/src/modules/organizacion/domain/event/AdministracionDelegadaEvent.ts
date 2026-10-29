import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

export class AdministracionDelegadaEvent implements DomainEvent {
	eventName = "organizacion.administracionDelegada";
	occurredOn = new Date();

	constructor(
		public readonly data: {
			organizacionId: number;
			deUsuarioId: number;
			aUsuarioId: number;
		},
	) {}
}
