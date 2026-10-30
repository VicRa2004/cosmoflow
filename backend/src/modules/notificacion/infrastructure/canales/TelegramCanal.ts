import type { BotTelegram } from "../../domain/BotTelegram";
import type {
	Aviso,
	CanalNotificacion,
	Destinatario,
} from "../../domain/CanalNotificacion";

export class TelegramCanal implements CanalNotificacion {
	readonly canal = "telegram";

	constructor(private readonly bot: BotTelegram) {}

	async enviar(destinatario: Destinatario, aviso: Aviso): Promise<void> {
		if (!destinatario.telegramChatId) return;
		await this.bot.enviar(
			destinatario.telegramChatId,
			`${aviso.asunto}\n\n${aviso.texto}\n${aviso.enlace}`,
		);
	}
}
