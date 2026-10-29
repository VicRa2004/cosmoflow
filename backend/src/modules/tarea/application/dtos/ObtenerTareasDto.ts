import type { TareaFiltros } from "../../domain/repository/TareaRepository";

/** Sin destino, las personales; `organizacionId` solo, las de la organización. */
export interface ObtenerTareasDto extends TareaFiltros {
	organizacionId?: number;
	equipoId?: number;
	proyectoId?: number;
}
