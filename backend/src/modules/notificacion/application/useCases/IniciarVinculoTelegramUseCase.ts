import { randomBytes } from "node:crypto";
import type { BotTelegram } from "../../domain/BotTelegram";
import { TelegramNoDisponibleError } from "../../domain/error/TelegramNoDisponibleError";
import type { VinculoTelegramRepository } from "../../domain/repository/VinculoTelegramRepository";
import { hashToken } from "../telegram/hashToken";

const VIGENCIA_MS = 15 * 60 * 1000;

/** Enlace de un solo uso: al abrirlo, el bot recibe `/start <token>` y vincula el chat. */
export class IniciarVinculoTelegramUseCase {
	constructor(
		private readonly repo: VinculoTelegramRepository,
		private readonly bot: BotTelegram | null,
	) {}

	async ejecutar(usuarioId: number): Promise<{ enlace: string }> {
		if (!this.bot) throw new TelegramNoDisponibleError();
		// Telegram admite hasta 64 caracteres [A-Za-z0-9_-] en el parámetro `start`.
		const token = randomBytes(24).toString("hex");
		await this.repo.guardarToken(
			usuarioId,
			hashToken(token),
			new Date(Date.now() + VIGENCIA_MS),
		);
		const bot = await this.bot.nombreUsuario();
		return { enlace: `https://t.me/${bot}?start=${token}` };
	}
}
