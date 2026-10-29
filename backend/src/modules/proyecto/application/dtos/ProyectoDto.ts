import type { CambiosProyecto, EstadoProyecto } from "../../domain/Proyecto";

export interface ProyectoDto {
	id: number;
	nombre: string;
	descripcion: string;
	estado: EstadoProyecto;
	equipoIds: number[];
	integranteIds: number[];
}

export type CrearProyectoDto = Required<CambiosProyecto>;
export type ActualizarProyectoDto = CambiosProyecto;

/** Quién pide y en qué organización (`/api/organizaciones/{organizacionId}/proyectos`). */
export interface AmbitoProyecto {
	usuarioId: number;
	organizacionId: number;
}
