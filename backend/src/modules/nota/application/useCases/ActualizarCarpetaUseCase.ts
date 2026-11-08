import type { CarpetaNotaRepository } from "../../domain/repository/CarpetaNotaRepository";
import type { ActualizarCarpetaDto, CarpetaDto } from "../dtos/CarpetaDto";
import { CarpetaMapper } from "../mappers/CarpetaMapper";
import type { CarpetasNota } from "../services/CarpetasNota";

/** Renombrar, cambiar icono o color, o moverla (`padreId`). */
export class ActualizarCarpetaUseCase {
	constructor(
		private readonly carpetaRepository: CarpetaNotaRepository,
		private readonly carpetas: CarpetasNota,
	) {}

	async ejecutar(
		usuarioId: number,
		id: number,
		dto: ActualizarCarpetaDto,
	): Promise<CarpetaDto> {
		const carpeta = await this.carpetas.buscarVisible(usuarioId, id);
		carpeta.actualizar(dto);
		await this.carpetas.validarPadre(carpeta);
		return CarpetaMapper.toDto(
			await this.carpetaRepository.actualizar(carpeta),
		);
	}
}
