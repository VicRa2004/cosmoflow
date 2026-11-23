import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { DestinoAviso } from "../CanalNotificacion";
import type { EventoNotificacion } from "../catalogo";

interface PersonaAviso {
	id: number;
	nombre: string;
}

export interface NotificacionApp {
	id: number;
	asunto: string;
	texto: string;
	enlace: string;
	tipo: DestinoAviso["tipo"] | null;
	recursoId: number | null;
	evento: EventoNotificacion | null;
	actor: PersonaAviso | null;
	/** Datos actuales de la tarea avisada; `null` si no es de tarea o ya no existe. */
	tarea: {
		titulo: string;
		responsables: (PersonaAviso & { asignadoPor: PersonaAviso | null })[];
	} | null;
	leida: boolean;
	createdAt: string;
}

export interface PaginaNotificaciones extends Paginacion<NotificacionApp> {
	/** Total de notificaciones sin leer del usuario (para el contador de la campana). */
	noLeidas: number;
}

export interface CrearNotificacionApp {
	usuarioId: number;
	asunto: string;
	texto: string;
	enlace: string;
	tipo: DestinoAviso["tipo"] | null;
	recursoId: number | null;
	evento: EventoNotificacion | null;
	actorId: number | null;
}

export interface FiltrosBandeja {
	pagina: number;
	limite: number;
	soloNoLeidas?: boolean;
}

/** Bandeja de notificaciones dentro de la app (campana, #51). */
export interface BandejaNotificacionRepository {
	crear(entrada: CrearNotificacionApp): Promise<void>;
	buscar(
		usuarioId: number,
		filtros: FiltrosBandeja,
	): Promise<PaginaNotificaciones>;
	/** Devuelve `false` si no existe o pertenece a otro usuario. */
	marcarLeida(usuarioId: number, id: number): Promise<boolean>;
	marcarTodasLeidas(usuarioId: number): Promise<number>;
	/** Borra las notificaciones ya leídas anteriores a `antesDe`. */
	purgarLeidas(antesDe: Date): Promise<number>;
}
