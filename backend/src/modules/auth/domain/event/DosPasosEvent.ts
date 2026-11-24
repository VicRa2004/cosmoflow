import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

/** Eventos de seguridad: los guarda el módulo `auditoria` (suscrito a `"*"`). */
export class DosPasosActivadoEvent implements DomainEvent {
	eventName = "auth.dosPasosActivado";
	occurredOn = new Date();

	constructor(public readonly data: { usuarioId: number }) {}
}

export class DosPasosDesactivadoEvent implements DomainEvent {
	eventName = "auth.dosPasosDesactivado";
	occurredOn = new Date();

	constructor(
		public readonly data: { usuarioId: number; metodo: "password" | "codigo" },
	) {}
}
