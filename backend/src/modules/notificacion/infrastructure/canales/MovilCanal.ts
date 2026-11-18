import { log } from "@/core/shared/infrastructure/logger";
import type {
	Aviso,
	CanalNotificacion,
	Destinatario,
} from "../../domain/CanalNotificacion";
import type { ClientePush } from "../../domain/ClientePush";
import type { DispositivoPushRepository } from "../../domain/repository/DispositivoPushRepository";

/**
 * Envía notificaciones push a todos los dispositivos registrados del usuario.
 * Si el proveedor marca un token como inválido, se elimina automáticamente.
 */
export class MovilCanal implements CanalNotificacion {
	readonly canal = "movil";

	constructor(
		private readonly cliente: ClientePush,
		private readonly dispositivos: DispositivoPushRepository,
	) {}

	async enviar(destinatario: Destinatario, aviso: Aviso): Promise<void> {
		if (destinatario.pushTokens.length === 0) return;

		const datos: Record<string, string> = { enlace: aviso.enlace };
		if (aviso.destino) {
			datos.tipo = aviso.destino.tipo;
			datos.id = String(aviso.destino.id);
		}

		let entregados = 0;
		let ultimoError: unknown = null;

		for (const token of destinatario.pushTokens) {
			try {
				const resultado = await this.cliente.enviar(token, {
					titulo: aviso.asunto,
					cuerpo: aviso.texto,
					datos,
				});
				if (resultado === "token_invalido") {
					await this.dispositivos.eliminarPorToken(token);
					log.info("Token push inválido eliminado", {
						usuarioId: destinatario.usuarioId,
					});
				} else {
					entregados++;
				}
			} catch (error) {
				ultimoError = error;
				log.warn("Error enviando notificación push a un dispositivo", {
					usuarioId: destinatario.usuarioId,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		// Solo reintentamos si ningún dispositivo recibió el aviso y hubo un error transitorio.
		if (entregados === 0 && ultimoError !== null) {
			throw ultimoError;
		}
	}
}
