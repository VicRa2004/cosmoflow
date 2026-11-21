import { NotificacionNoEncontradaError } from "../../domain/error/NotificacionNoEncontradaError";
import type { BandejaNotificacionRepository } from "../../domain/repository/BandejaNotificacionRepository";

export class MarcarNotificacionLeidaUseCase {
	constructor(private readonly bandeja: BandejaNotificacionRepository) {}

	async ejecutar(usuarioId: number, id: number): Promise<void> {
		const marcada = await this.bandeja.marcarLeida(usuarioId, id);
		if (!marcada) throw new NotificacionNoEncontradaError();
	}
}
