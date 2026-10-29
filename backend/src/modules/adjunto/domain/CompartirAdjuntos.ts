import type { AmbitoAdjunto } from "./Adjunto";

/** Para otros módulos: al mover una tarea personal, sus imágenes pasan con ella. */
export interface CompartirAdjuntos {
	/** Solo los adjuntos propios y aún privados de `usuarioId`; el resto se ignora. */
	compartir: (
		usuarioId: number,
		adjuntoIds: number[],
		ambito: AmbitoAdjunto,
	) => Promise<void>;
}
