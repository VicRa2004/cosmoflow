import type { Aviso, CanalNotificacion } from "../../domain/CanalNotificacion";
import {
	type EventoNotificacion,
	resolverPreferencias,
} from "../../domain/catalogo";
import type { NotificacionRepository } from "../../domain/repository/NotificacionRepository";

/**
 * Avisa por cada canal que el destinatario tenga activo para el evento (lo suyo y, si
 * no eligió, lo de la organización de la tarea: RN-92). Nunca a
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
		organizacionId,
		clave,
		aviso,
	}: {
		evento: EventoNotificacion;
		/** De la tarea; `null` si es personal. */
		organizacionId: number | null;
		usuarioIds: number[];
		actorId?: number;
		/** Identifica el suceso: igual en todos los reintentos del mismo evento. */
		clave: string;
		aviso: Aviso;
	}): Promise<void> {
		const ids = [...new Set(usuarioIds)].filter((id) => id !== actorId);
		if (ids.length === 0) return;
		const deOrganizacion =
			organizacionId === null
				? []
				: await this.repo.preferenciasOrganizacion(organizacionId);

		for (const destinatario of await this.repo.destinatarios(ids)) {
			const preferencias = resolverPreferencias(
				await this.repo.preferencias(destinatario.usuarioId),
				deOrganizacion,
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
