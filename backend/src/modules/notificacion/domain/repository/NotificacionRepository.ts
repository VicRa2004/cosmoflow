import type { Destinatario } from "../CanalNotificacion";
import type { Preferencia } from "../catalogo";

export interface TareaPorVencer {
	id: number;
	titulo: string;
	/** Día `AAAA-MM-DD`. */
	fechaVencimiento: string;
	organizacionId: number | null;
	/** Quien la creó; en las personales, su dueño. */
	usuarioId: number;
	responsableIds: number[];
}

export interface NotificacionRepository {
	/** Solo las guardadas; el resto vale lo de `ACTIVO_POR_DEFECTO`. */
	preferencias(usuarioId: number): Promise<Preferencia[]>;
	guardarPreferencias(
		usuarioId: number,
		preferencias: Preferencia[],
	): Promise<void>;
	preferenciasOrganizacion(organizacionId: number): Promise<Preferencia[]>;
	guardarPreferenciasOrganizacion(
		organizacionId: number,
		preferencias: Preferencia[],
	): Promise<void>;
	/** Usuarios activos y no borrados; los demás se omiten. */
	destinatarios(usuarioIds: number[]): Promise<Destinatario[]>;
	/** `null` si la tarea ya no existe o está borrada. */
	tarea(
		tareaId: number,
	): Promise<{ titulo: string; organizacionId: number | null } | null>;
	/** Sin completar ni cancelar ni borrar, que vencen alguno de esos días (`AAAA-MM-DD`). */
	tareasPorVencer(dias: string[]): Promise<TareaPorVencer[]>;
	/** `false` si ya estaba registrado: otro intento ya lo envió. */
	registrarEnvio(clave: string): Promise<boolean>;
	anularEnvio(clave: string): Promise<void>;
	purgarEnvios(antesDe: Date): Promise<void>;
}
