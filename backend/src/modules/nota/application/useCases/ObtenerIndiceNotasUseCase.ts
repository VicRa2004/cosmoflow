import type {
	NotaIndice,
	NotaRepository,
} from "../../domain/repository/NotaRepository";
import type { ObtenerIndiceNotasDto } from "../dtos/ObtenerNotasDto";
import type { ProyectosNota } from "../services/ProyectosNota";

/** Todas las notas del ámbito, sin contenido: lo justo para el explorador. */
export class ObtenerIndiceNotasUseCase {
	constructor(
		private readonly notaRepository: NotaRepository,
		private readonly proyectos: ProyectosNota,
	) {}

	async ejecutar(
		usuarioId: number,
		{ proyectoId, ...filtros }: ObtenerIndiceNotasDto,
	): Promise<NotaIndice[]> {
		if (proyectoId) await this.proyectos.exigir(usuarioId, proyectoId);
		return this.notaRepository.buscarIndice(
			proyectoId ? { proyectoId } : { usuarioId },
			filtros,
		);
	}
}
