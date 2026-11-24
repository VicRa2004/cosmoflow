import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";

/** Baja voluntaria; sin email ni nombre: la cuenta queda anonimizada. */
export class CuentaEliminadaEvent implements DomainEvent {
	eventName = "auth.cuentaEliminada";
	occurredOn = new Date();

	constructor(public readonly data: { usuarioId: number }) {}
}
