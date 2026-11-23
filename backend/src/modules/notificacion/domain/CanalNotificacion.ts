import type { CanalId, EventoNotificacion } from "./catalogo";

export interface Destinatario {
	usuarioId: number;
	email: string;
	nombre: string;
	/** `null` si no vinculó Telegram: ese canal no le avisa. */
	telegramChatId: string | null;
	/** Tokens FCM activos del usuario; vacío si no registró ningún dispositivo. */
	pushTokens: string[];
}

export interface DestinoAviso {
	tipo: "tarea" | "nota";
	id: number;
}

export interface Aviso {
	asunto: string;
	texto: string;
	/** Página de la app donde se ve lo avisado. */
	enlace: string;
	/** Destino estructurado para que la app móvil abra la pantalla correspondiente. */
	destino?: DestinoAviso;
	/** Los rellena el `Notificador`; la bandeja los usa para explicar el aviso. */
	evento?: EventoNotificacion;
	actorId?: number;
}

/** Puerto de un canal (correo, Telegram…): añadir uno no toca el núcleo. */
export interface CanalNotificacion {
	readonly canal: CanalId;
	enviar(destinatario: Destinatario, aviso: Aviso): Promise<void>;
}
