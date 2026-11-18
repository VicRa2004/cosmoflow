export interface MensajePush {
	titulo: string;
	cuerpo: string;
	/** Datos adicionales en texto plano (requisito de FCM HTTP v1). */
	datos?: Record<string, string>;
}

export type ResultadoEnvioPush = "enviado" | "token_invalido";

/** Puerto del proveedor de notificaciones push (FCM HTTP v1). */
export interface ClientePush {
	enviar(token: string, mensaje: MensajePush): Promise<ResultadoEnvioPush>;
}
