import { log } from "@/core/shared/infrastructure/logger";
import type { BotTelegram, MensajeTelegram } from "../../domain/BotTelegram";

interface RespuestaTelegram<T> {
	ok: boolean;
	result?: T;
	description?: string;
}
interface Update {
	update_id: number;
	message?: { chat: { id: number; type: string }; text?: string };
}

/** Segundos que `getUpdates` espera mensajes antes de responder vacío (long polling). */
const ESPERA_S = 10;

/** API HTTP de Telegram con `fetch`. Una sola réplica: el `offset` vive en memoria. */
export class TelegramBotApi implements BotTelegram {
	private offset = 0;
	private usuario?: string;

	constructor(private readonly token: string) {}

	async nombreUsuario(): Promise<string> {
		this.usuario ??= (
			await this.llamar<{ username: string }>("getMe")
		).username;
		return this.usuario;
	}

	async enviar(chatId: string, texto: string): Promise<boolean> {
		const res = await this.pedir("sendMessage", {
			chat_id: chatId,
			text: texto,
			link_preview_options: { is_disabled: true },
		});
		// shortcut: 403 = bloqueó el bot o borró el chat; no se desvincula solo, lo hace él desde el perfil.
		if (res.status === 403) {
			log.warn("[Telegram] El chat no acepta mensajes", { chatId });
			return false;
		}
		await this.resultado(res, "sendMessage");
		return true;
	}

	async recibir(): Promise<MensajeTelegram[]> {
		const updates = await this.llamar<Update[]>("getUpdates", {
			offset: this.offset,
			timeout: ESPERA_S,
			allowed_updates: ["message"],
		});
		// El siguiente `offset` confirma estos updates: Telegram no los vuelve a dar.
		for (const update of updates) this.offset = update.update_id + 1;
		return updates.flatMap(({ message }) =>
			message?.text
				? [
						{
							chatId: String(message.chat.id),
							privado: message.chat.type === "private",
							texto: message.text.trim(),
						},
					]
				: [],
		);
	}

	private async llamar<T>(metodo: string, cuerpo: object = {}): Promise<T> {
		return this.resultado<T>(await this.pedir(metodo, cuerpo), metodo);
	}

	private pedir(metodo: string, cuerpo: object): Promise<Response> {
		return fetch(`https://api.telegram.org/bot${this.token}/${metodo}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(cuerpo),
			signal: AbortSignal.timeout((ESPERA_S + 10) * 1000),
		});
	}

	private async resultado<T>(res: Response, metodo: string): Promise<T> {
		const json = (await res.json()) as RespuestaTelegram<T>;
		// Sin el token en el mensaje: acabaría en los logs.
		if (!json.ok || json.result === undefined) {
			throw new Error(`Telegram ${metodo}: ${json.description ?? res.status}`);
		}
		return json.result;
	}
}
