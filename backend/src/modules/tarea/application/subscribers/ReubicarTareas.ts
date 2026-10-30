import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";
import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type {
	GrupoTareas,
	TareaRepository,
} from "../../domain/repository/TareaRepository";

/**
 * Equipo o proyecto eliminado → sus tareas pasan a la organización; actualizado →
 * deja de ser responsable quien ya no ve la tarea. Idempotente (outbox).
 */
export class ReubicarTareas {
	constructor(
		private readonly eventBus: EventBus,
		private readonly repo: TareaRepository,
	) {}

	public suscribir(): void {
		const grupo = (event: DomainEvent) => event.data as GrupoTareas;
		this.eventBus.subscribe("equipo.eliminado", (e) =>
			this.repo.pasarAOrganizacion(grupo(e)),
		);
		this.eventBus.subscribe("proyecto.eliminado", (e) =>
			this.repo.pasarAOrganizacion(grupo(e)),
		);
		this.eventBus.subscribe("equipo.actualizado", (e) =>
			this.repo.depurarResponsables(grupo(e)),
		);
		this.eventBus.subscribe("proyecto.actualizado", (e) =>
			this.repo.depurarResponsables(grupo(e)),
		);
	}
}
