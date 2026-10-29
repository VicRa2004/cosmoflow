import { NotaNoEncontradaError } from "../../domain/error/NotaNoEncontradaError";
import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import type { NotaRepository } from "../../domain/repository/NotaRepository";
import type { ActualizarNotaDto } from "../dtos/ActualizarNotaDto";
import type { NotaDto } from "../dtos/NotaDto";
import { NotaMapper } from "../mappers/NotaMapper";

export class ActualizarNotaUseCase {
	constructor(private readonly notaRepository: NotaRepository) {}

	async ejecutar(
		usuarioId: number,
		id: number,
		dto: ActualizarNotaDto,
	): Promise<NotaDto> {
		const nota = await this.notaRepository.buscarPorId(usuarioId, id);
		if (!nota) {
			throw new NotaNoEncontradaError();
		}
		if (
			dto.tagIds?.length &&
			!(await this.notaRepository.sonTagsPropios(usuarioId, dto.tagIds))
		) {
			throw new TagsAjenosError();
		}
		nota.actualizar(dto);
		return NotaMapper.toDto(await this.notaRepository.actualizar(nota));
	}
}
