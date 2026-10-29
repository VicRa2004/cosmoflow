import type { NotaRepository } from "../../domain/repository/NotaRepository";
import type { ObtenerNotasDto } from "../dtos/ObtenerNotasDto";
import type { NotaDto } from "../dtos/NotaDto";
import type { Paginacion } from "@/core/shared/domain/Paginacion";
import { NotaMapper } from "../mappers/NotaMapper";

export class ObtenerNotasUseCase {
	constructor(private readonly notaRepository: NotaRepository) {}

	async ejecutar(
		usuarioId: number,
		dto: ObtenerNotasDto,
	): Promise<Paginacion<NotaDto>> {
		const resultado = await this.notaRepository.buscar(usuarioId, dto);
		return { ...resultado, datos: resultado.datos.map(NotaMapper.toDto) };
	}
}
