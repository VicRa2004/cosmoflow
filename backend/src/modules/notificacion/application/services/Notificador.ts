import type { Aviso, CanalNotificacion } from "../../domain/CanalNotificacion";
import {
	type EventoNotificacion,
	resolverPreferencias,
} from "../../domain/catalogo";
import type { NotificacionRepository } from "../../domain/repository/NotificacionRepository";

/**
 * Avisa por cada canal que el destinatario tenga activo para el evento. Nunca a
 * quien hizo la acción. Cada envío se registra con su clave antes de mandarlo, así
 * un reintento del outbox no lo repite; si el canal falla se anula y se reintenta.
 */
export class Notificador {
	constructor(
		private readonly repo: NotificacionRepository,
		private readonly canales: CanalNotificacion[],
	) {}

	async notificar({
		evento,
		usuarioIds,
		actorId,
		clave,
		aviso,
	}: {
		evento: EventoNotificacion;
		usuarioIds: number[];
		actorId?: number;
		/** Identifica el suceso: igual en todos los reintentos del mismo evento. */
		clave: string;
		aviso: Aviso;
	}): Promise<void> {
		const ids = [...new Set(usuarioIds)].filter((id) => id !== actorId);
		if (ids.length === 0) return;

		for (const destinatario of await this.repo.destinatarios(ids)) {
			const preferencias = resolverPreferencias(
				await this.repo.preferencias(destinatario.usuarioId),
			);
			for (const canal of this.canales) {
				const activo = preferencias.some(
					(p) => p.evento === evento && p.canal === canal.canal && p.activo,
				);
				if (!activo) continue;
				const claveEnvio = `${clave}:${destinatario.usuarioId}:${canal.canal}`;
				if (!(await this.repo.registrarEnvio(claveEnvio))) continue;
				try {
					await canal.enviar(destinatario, aviso);
				} catch (error) {
					await this.repo.anularEnvio(claveEnvio);
					throw error;
				}
			}
		}
	}
}
