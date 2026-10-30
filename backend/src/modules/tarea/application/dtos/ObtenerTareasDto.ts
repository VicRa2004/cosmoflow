import type { TareaFiltros } from "../../domain/repository/TareaRepository";

/**
 * Sin destino, las personales; `organizacionId` solo, las de la organización;
 * `asignadas`, aquellas en las que es responsable (sin destino).
 */
export interface ObtenerTareasDto extends TareaFiltros {
	asignadas?: boolean;
	organizacionId?: number;
	equipoId?: number;
	proyectoId?: number;
}
