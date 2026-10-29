import type { CambiosEquipo } from "../../domain/Equipo";

export interface EquipoDto {
	id: number;
	nombre: string;
	descripcion: string;
	color: string;
	liderId: number | null;
	miembros: { usuarioId: number; puedeCrearTareas: boolean }[];
	tagIds: number[];
}

export type CrearEquipoDto = Required<CambiosEquipo>;
export type ActualizarEquipoDto = CambiosEquipo;

/** Quién pide y en qué organización (`/api/organizaciones/{organizacionId}/equipos`). */
export interface AmbitoEquipo {
	usuarioId: number;
	organizacionId: number;
}
