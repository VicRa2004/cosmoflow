import type {
	Aviso,
	CanalNotificacion,
	Destinatario,
} from "../../domain/CanalNotificacion";
import type { BandejaNotificacionRepository } from "../../domain/repository/BandejaNotificacionRepository";

/** Guarda el aviso en la bandeja del usuario para mostrarlo en la campana (#51). */
export class AppCanal implements CanalNotificacion {
	readonly canal = "app" as const;

	constructor(private readonly bandeja: BandejaNotificacionRepository) {}

	async enviar(destinatario: Destinatario, aviso: Aviso): Promise<void> {
		await this.bandeja.crear({
			usuarioId: destinatario.usuarioId,
			asunto: aviso.asunto,
			texto: aviso.texto,
			enlace: aviso.enlace,
			tipo: aviso.destino?.tipo ?? null,
			recursoId: aviso.destino?.id ?? null,
			evento: aviso.evento ?? null,
			actorId: aviso.actorId ?? null,
		});
	}
}
