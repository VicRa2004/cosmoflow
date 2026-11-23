import type { DomainEvent } from "@/core/shared/domain/events/DomainEvent";
import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { NotificacionRepository } from "../../domain/repository/NotificacionRepository";
import type { Notificador } from "../services/Notificador";

// Forma de los eventos de `tarea` (el contrato es el nombre del evento y sus datos).
interface ResponsablesAsignados {
	tareaId: number;
	usuarioIds: number[];
}
interface Mencionados {
	tareaId: number;
	usuarioIds: number[];
}
interface Comentada {
	tareaId: number;
	autorId: number;
	mencionIds: number[];
	respondeAAutorId?: number | null;
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

/**
 * Tarea asignada → sus responsables nuevos; mención → los mencionados nuevos; cambio
 * de estado → quien la creó; comentario → los mencionados (como mención) y, el resto,
 * sus responsables y quien la creó, nunca el autor.
 */
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
		this.eventBus.subscribe("tarea.mencionados", (event) =>
			this.onMencionados(event),
		);
		this.eventBus.subscribe("tarea.estadoCambiado", (event) =>
			this.onEstadoCambiado(event),
		);
		this.eventBus.subscribe("tarea.comentada", (event) =>
			this.onComentada(event),
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
				destino: { tipo: "tarea", id: tareaId },
			},
		});
	}

	private async onMencionados(event: DomainEvent): Promise<void> {
		const { tareaId, usuarioIds } = event.data as Mencionados;
		const tarea = await this.repo.tarea(tareaId);
		if (tarea === null) return;
		const { titulo, organizacionId } = tarea;
		await this.notificador.notificar({
			evento: "mencion",
			usuarioIds,
			organizacionId,
			clave: this.clave(event, tareaId),
			actorId: event.meta?.usuarioId,
			aviso: {
				asunto: `Te mencionaron en «${titulo}»`,
				texto: `Te mencionaron en la tarea «${titulo}».`,
				enlace: this.enlace(tareaId),
				destino: { tipo: "tarea", id: tareaId },
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
				destino: { tipo: "tarea", id: tareaId },
			},
		});
	}

	private async onComentada(event: DomainEvent): Promise<void> {
		const { tareaId, autorId, mencionIds, respondeAAutorId } =
			event.data as Comentada;
		const tarea = await this.repo.tarea(tareaId);
		if (tarea === null) return;
		const { titulo, organizacionId } = tarea;
		const enlace = this.enlace(tareaId);
		const destino = { tipo: "tarea" as const, id: tareaId };
		const autorRespondido =
			respondeAAutorId != null &&
			respondeAAutorId !== autorId &&
			!mencionIds.includes(respondeAAutorId)
				? respondeAAutorId
				: null;
		const interesados = [
			...new Set([tarea.usuarioId, ...tarea.responsableIds]),
		].filter(
			(id) =>
				id !== autorId && !mencionIds.includes(id) && id !== autorRespondido,
		);
		// Clave por grupo: cada envío se registra aparte y no se pisan.
		await this.notificador.notificar({
			evento: "mencion",
			usuarioIds: mencionIds,
			organizacionId,
			actorId: event.meta?.usuarioId,
			clave: `${this.clave(event, tareaId)}:mencion`,
			aviso: {
				asunto: `Te mencionaron en un comentario de «${titulo}»`,
				texto: `Te mencionaron en un comentario de la tarea «${titulo}».`,
				enlace,
				destino,
			},
		});
		if (autorRespondido !== null) {
			await this.notificador.notificar({
				evento: "comentario",
				usuarioIds: [autorRespondido],
				organizacionId,
				actorId: event.meta?.usuarioId,
				clave: `${this.clave(event, tareaId)}:respuesta`,
				aviso: {
					asunto: `Respondieron a tu comentario en «${titulo}»`,
					texto: `Alguien respondió a tu comentario en la tarea «${titulo}».`,
					enlace,
					destino,
				},
			});
		}
		await this.notificador.notificar({
			evento: "comentario",
			usuarioIds: interesados,
			organizacionId,
			actorId: event.meta?.usuarioId,
			clave: `${this.clave(event, tareaId)}:comentario`,
			aviso: {
				asunto: `Nuevo comentario en «${titulo}»`,
				texto: `Hay un comentario nuevo en la tarea «${titulo}».`,
				enlace,
				destino,
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
