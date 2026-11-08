import type { CarpetaNotaRepository } from "../../domain/repository/CarpetaNotaRepository";
import type { CarpetaDto } from "../dtos/CarpetaDto";
import { CarpetaMapper } from "../mappers/CarpetaMapper";
import type { ProyectosNota } from "../services/ProyectosNota";

/** Todas las personales, o las de un proyecto del que se es miembro. */
export class ObtenerCarpetasUseCase {
	constructor(
		private readonly carpetaRepository: CarpetaNotaRepository,
		private readonly proyectos: ProyectosNota,
	) {}

	async ejecutar(
		usuarioId: number,
		proyectoId?: number,
	): Promise<CarpetaDto[]> {
		if (proyectoId) await this.proyectos.exigir(usuarioId, proyectoId);
		const carpetas = await this.carpetaRepository.buscar(
			proyectoId ? { proyectoId } : { usuarioId },
		);
		return carpetas.map(CarpetaMapper.toDto);
	}
}
