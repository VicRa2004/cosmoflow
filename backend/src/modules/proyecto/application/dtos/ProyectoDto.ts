import type { CambiosProyecto, EstadoProyecto } from "../../domain/Proyecto";
import type { ProgresoProyecto } from "../../domain/repository/ProyectoRepository";

export interface ProyectoDto {
	id: number;
	nombre: string;
	descripcion: string;
	estado: EstadoProyecto;
	color: string | null;
	fechaInicio: string | null;
	fechaFin: string | null;
	progreso: ProgresoProyecto;
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
