import type {
	NotaFiltros,
	NotaIndiceFiltros,
} from "../../domain/repository/NotaRepository";

/** Sin `proyectoId`, las personales. */
export interface ObtenerNotasDto extends NotaFiltros {
	proyectoId?: number;
}

/** Sin `proyectoId`, las personales. */
export interface ObtenerIndiceNotasDto extends NotaIndiceFiltros {
	proyectoId?: number;
}
