import type {
	BusquedaRepository,
	ResultadosBusqueda,
} from "../../domain/repository/BusquedaRepository";

/** Resultados por tipo para la paleta Ctrl+K: pocos de cada uno. */
const LIMITE_POR_TIPO = 5;

export class BuscarUseCase {
	constructor(private readonly busquedaRepository: BusquedaRepository) {}

	ejecutar(usuarioId: number, texto: string): Promise<ResultadosBusqueda> {
		return this.busquedaRepository.buscar(usuarioId, texto, LIMITE_POR_TIPO);
	}
}
