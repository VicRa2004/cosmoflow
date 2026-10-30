import type { BotTelegram } from "../../domain/BotTelegram";
import type { VinculoTelegramRepository } from "../../domain/repository/VinculoTelegramRepository";

/** `disponible`: hay bot configurado; la interfaz oculta Telegram si no. */
export class ObtenerEstadoTelegramUseCase {
	constructor(
		private readonly repo: VinculoTelegramRepository,
		private readonly bot: BotTelegram | null,
	) {}

	async ejecutar(
		usuarioId: number,
	): Promise<{ disponible: boolean; vinculado: boolean }> {
		return {
			disponible: this.bot !== null,
			vinculado: await this.repo.estaVinculado(usuarioId),
		};
	}
}
