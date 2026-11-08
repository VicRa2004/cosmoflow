import { CarpetaNota } from "../../domain/CarpetaNota";
import type { CarpetaNotaRepository } from "../../domain/repository/CarpetaNotaRepository";
import type { CarpetaDto, CrearCarpetaDto } from "../dtos/CarpetaDto";
import { CarpetaMapper } from "../mappers/CarpetaMapper";
import type { CarpetasNota } from "../services/CarpetasNota";
import type { ProyectosNota } from "../services/ProyectosNota";

/** Personal, o en un proyecto del que se es miembro (RN-33). */
export class CrearCarpetaUseCase {
	constructor(
		private readonly carpetaRepository: CarpetaNotaRepository,
		private readonly proyectos: ProyectosNota,
		private readonly carpetas: CarpetasNota,
	) {}

	async ejecutar(
		usuarioId: number,
		{ proyectoId, ...campos }: CrearCarpetaDto,
	): Promise<CarpetaDto> {
		const proyecto = proyectoId
			? await this.proyectos.exigir(usuarioId, proyectoId)
			: null;
		const carpeta = CarpetaNota.crear(usuarioId, campos, proyecto);
		await this.carpetas.validarPadre(carpeta);
		return CarpetaMapper.toDto(await this.carpetaRepository.crear(carpeta));
	}
}
