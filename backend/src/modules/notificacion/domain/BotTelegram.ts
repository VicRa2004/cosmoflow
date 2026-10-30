export interface MensajeTelegram {
	chatId: string;
	/** Solo los chats privados con el bot vinculan cuentas. */
	privado: boolean;
	texto: string;
}

/** Puerto del bot de Telegram (API HTTP de Telegram en infraestructura). */
export interface BotTelegram {
	/** `@usuario` del bot, para el enlace `t.me/<usuario>?start=<token>`. */
	nombreUsuario(): Promise<string>;
	/** `false` si el usuario bloqueó el bot o borró el chat: no tiene sentido reintentar. */
	enviar(chatId: string, texto: string): Promise<boolean>;
	/** Mensajes nuevos desde la última llamada (long polling). */
	recibir(): Promise<MensajeTelegram[]>;
}
