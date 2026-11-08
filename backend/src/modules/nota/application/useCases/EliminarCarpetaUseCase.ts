import type { CarpetaNotaRepository } from "../../domain/repository/CarpetaNotaRepository";
import type { CarpetasNota } from "../services/CarpetasNota";

/** Su contenido (notas y subcarpetas) sube a la carpeta padre. */
export class EliminarCarpetaUseCase {
	constructor(
		private readonly carpetaRepository: CarpetaNotaRepository,
		private readonly carpetas: CarpetasNota,
	) {}

	async ejecutar(usuarioId: number, id: number): Promise<void> {
		await this.carpetas.buscarVisible(usuarioId, id);
		await this.carpetaRepository.eliminar(id);
	}
}
