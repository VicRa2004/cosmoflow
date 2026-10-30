import type { CanalId } from "./catalogo";

export interface Destinatario {
	usuarioId: number;
	email: string;
	nombre: string;
	/** `null` si no vinculó Telegram: ese canal no le avisa. */
	telegramChatId: string | null;
}

export interface Aviso {
	asunto: string;
	texto: string;
	/** Página de la app donde se ve lo avisado. */
	enlace: string;
}

/** Puerto de un canal (correo, Telegram…): añadir uno no toca el núcleo. */
export interface CanalNotificacion {
	readonly canal: CanalId;
	enviar(destinatario: Destinatario, aviso: Aviso): Promise<void>;
}
