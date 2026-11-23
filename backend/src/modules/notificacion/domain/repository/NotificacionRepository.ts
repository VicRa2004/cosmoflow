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

export interface TareaDelDia {
	id: number;
	titulo: string;
	/** Días `AAAA-MM-DD` o `null`. */
	fechaInicio: string | null;
	fechaVencimiento: string | null;
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
	tarea(tareaId: number): Promise<{
		titulo: string;
		organizacionId: number | null;
		/** Quien la creó */
		usuarioId: number;
		responsableIds: number[];
	} | null>;
	/** Sin completar ni cancelar ni borrar, que vencen alguno de esos días (`AAAA-MM-DD`). */
	tareasPorVencer(dias: string[]): Promise<TareaPorVencer[]>;
	/** Quienes activaron el resumen diario en algún canal (no está activo por defecto). */
	usuariosConResumenDiario(): Promise<number[]>;
	/**
	 * Pendientes y en progreso del usuario (personales y en las que es responsable,
	 * como la vista Pendientes) que vencen hasta `hoy` incluido o empiezan `hoy`.
	 */
	tareasDelDia(usuarioId: number, hoy: string): Promise<TareaDelDia[]>;
	/** `false` si ya estaba registrado: otro intento ya lo envió. */
	registrarEnvio(clave: string): Promise<boolean>;
	anularEnvio(clave: string): Promise<void>;
	purgarEnvios(antesDe: Date): Promise<void>;
}
