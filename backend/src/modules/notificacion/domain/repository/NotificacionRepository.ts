import type { Destinatario } from "../CanalNotificacion";
import type { Preferencia } from "../catalogo";

export interface NotificacionRepository {
	/** Solo las guardadas; el resto vale lo de `ACTIVO_POR_DEFECTO`. */
	preferencias(usuarioId: number): Promise<Preferencia[]>;
	guardarPreferencias(
		usuarioId: number,
		preferencias: Preferencia[],
	): Promise<void>;
	/** Usuarios activos y no borrados; los demás se omiten. */
	destinatarios(usuarioIds: number[]): Promise<Destinatario[]>;
	/** `null` si la tarea ya no existe o está borrada. */
	tituloTarea(tareaId: number): Promise<string | null>;
	/** `false` si ya estaba registrado: otro intento ya lo envió. */
	registrarEnvio(clave: string): Promise<boolean>;
	anularEnvio(clave: string): Promise<void>;
	purgarEnvios(antesDe: Date): Promise<void>;
}
