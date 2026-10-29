import type { TareaFiltros } from "../../domain/repository/TareaRepository";

/** Sin `equipoId` ni `proyectoId`, las personales. */
export interface ObtenerTareasDto extends TareaFiltros {
	equipoId?: number;
	proyectoId?: number;
}
