import type { BotTelegram } from "../../domain/BotTelegram";
import type { VinculoTelegramRepository } from "../../domain/repository/VinculoTelegramRepository";
import { hashToken } from "./hashToken";

/** Lo llama el `Scheduler`: lee los mensajes del bot y vincula con `/start <token>`. */
export class AtenderBotTelegram {
	constructor(
		private readonly bot: BotTelegram,
		private readonly repo: VinculoTelegramRepository,
	) {}

	async ejecutar(): Promise<void> {
		for (const { chatId, privado, texto } of await this.bot.recibir()) {
			if (!privado) continue;
			const token = texto.match(/^\/start\s+([a-f0-9]{48})$/)?.[1];
			if (!token) {
				await this.bot.enviar(
					chatId,
					"Hola. Para recibir avisos, abre el enlace «Vincular Telegram» de tu perfil en Cosmoflow.",
				);
				continue;
			}
			const vinculado = await this.repo.vincularPorToken(
				hashToken(token),
				chatId,
			);
			await this.bot.enviar(
				chatId,
				vinculado
					? "¡Listo! Tu cuenta de Cosmoflow está vinculada. Elige qué avisos recibir aquí desde tu perfil."
					: "El enlace caducó o ya se usó. Genera uno nuevo desde tu perfil en Cosmoflow.",
			);
		}
	}
}
