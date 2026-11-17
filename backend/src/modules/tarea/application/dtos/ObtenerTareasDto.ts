import type { TareaFiltros } from "../../domain/repository/TareaRepository";

/**
 * Sin destino, las personales; `organizacionId` solo, las de la organización;
 * `asignadas`, aquellas en las que es responsable; `asignadasPorMi`, las que asignó a
 * otros (ambos sin destino).
 */
export interface ObtenerTareasDto extends TareaFiltros {
	asignadas?: boolean;
	asignadasPorMi?: boolean;
	organizacionId?: number;
	equipoId?: number;
	proyectoId?: number;
}
