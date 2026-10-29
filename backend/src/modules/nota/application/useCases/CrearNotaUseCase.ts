import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import { Nota } from "../../domain/Nota";
import type { NotaRepository } from "../../domain/repository/NotaRepository";
import type { CrearNotaDto } from "../dtos/CrearNotaDto";
import type { NotaDto } from "../dtos/NotaDto";
import { NotaMapper } from "../mappers/NotaMapper";

export class CrearNotaUseCase {
	constructor(private readonly notaRepository: NotaRepository) {}

	async ejecutar(usuarioId: number, dto: CrearNotaDto): Promise<NotaDto> {
		if (
			dto.tagIds?.length &&
			!(await this.notaRepository.sonTagsPropios(usuarioId, dto.tagIds))
		) {
			throw new TagsAjenosError();
		}
		const creada = await this.notaRepository.crear(Nota.crear(usuarioId, dto));
		return NotaMapper.toDto(creada);
	}
}
