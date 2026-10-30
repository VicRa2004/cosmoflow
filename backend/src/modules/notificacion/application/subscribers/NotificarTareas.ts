import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";
import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { NotificacionRepository } from "../../domain/repository/NotificacionRepository";
import type { Notificador } from "../services/Notificador";

// Forma de los eventos de `tarea` (el contrato es el nombre del evento y sus datos).
interface ResponsablesAsignados {
	tareaId: number;
	usuarioIds: number[];
}
interface EstadoCambiado {
	tareaId: number;
	creadorId: number;
	anterior: string;
	nuevo: string;
}

const ETIQUETAS_ESTADO: Record<string, string> = {
	pendiente: "Pendiente",
	en_progreso: "En progreso",
	completada: "Completada",
	cancelada: "Cancelada",
};
const etiqueta = (estado: string) => ETIQUETAS_ESTADO[estado] ?? estado;

/** Tarea asignada → sus responsables nuevos; cambio de estado → quien la creó. */
export class NotificarTareas {
	constructor(
		private readonly eventBus: EventBus,
		private readonly repo: NotificacionRepository,
		private readonly notificador: Notificador,
		private readonly appUrl: string,
	) {}

	public suscribir(): void {
		this.eventBus.subscribe("tarea.responsablesAsignados", (event) =>
			this.onAsignada(event),
		);
		this.eventBus.subscribe("tarea.estadoCambiado", (event) =>
			this.onEstadoCambiado(event),
		);
	}

	private async onAsignada(event: DomainEvent): Promise<void> {
		const { tareaId, usuarioIds } = event.data as ResponsablesAsignados;
		const tarea = await this.repo.tarea(tareaId);
		if (tarea === null) return;
		const { titulo, organizacionId } = tarea;
		await this.notificador.notificar({
			evento: "tareaAsignada",
			usuarioIds,
			organizacionId,
			actorId: event.meta?.usuarioId,
			clave: this.clave(event, tareaId),
			aviso: {
				asunto: `Te asignaron «${titulo}»`,
				texto: `Ahora eres responsable de la tarea «${titulo}».`,
				enlace: this.enlace(tareaId),
			},
		});
	}

	private async onEstadoCambiado(event: DomainEvent): Promise<void> {
		const { tareaId, creadorId, anterior, nuevo } =
			event.data as EstadoCambiado;
		const tarea = await this.repo.tarea(tareaId);
		if (tarea === null) return;
		const { titulo, organizacionId } = tarea;
		await this.notificador.notificar({
			evento: "estadoCambiado",
			usuarioIds: [creadorId],
			organizacionId,
			actorId: event.meta?.usuarioId,
			clave: this.clave(event, tareaId),
			aviso: {
				asunto: `«${titulo}» pasó a ${etiqueta(nuevo)}`,
				texto: `La tarea «${titulo}» que creaste pasó de ${etiqueta(anterior)} a ${etiqueta(nuevo)}.`,
				enlace: this.enlace(tareaId),
			},
		});
	}

	private clave(event: DomainEvent, tareaId: number): string {
		return `${event.eventName}:${tareaId}:${new Date(event.occurredOn).toISOString()}`;
	}

	private enlace(tareaId: number): string {
		return `${this.appUrl}/tareas/${tareaId}`;
	}
}
