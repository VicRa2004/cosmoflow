import type { BandejaNotificacionRepository } from "../../domain/repository/BandejaNotificacionRepository";

export class MarcarTodasNotificacionesLeidasUseCase {
	constructor(private readonly bandeja: BandejaNotificacionRepository) {}

	async ejecutar(usuarioId: number): Promise<void> {
		await this.bandeja.marcarTodasLeidas(usuarioId);
	}
}
