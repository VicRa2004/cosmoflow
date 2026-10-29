import type { NotaFiltros } from "../../domain/repository/NotaRepository";

/** Sin `proyectoId`, las personales. */
export interface ObtenerNotasDto extends NotaFiltros {
	proyectoId?: number;
}
