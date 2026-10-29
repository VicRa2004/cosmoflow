import { TagDuplicadoError } from "../../domain/error/TagDuplicadoError";
import type { TagRepository } from "../../domain/repository/TagRepository";
import { Tag } from "../../domain/Tag";
import type { CrearTagDto } from "../dtos/CrearTagDto";
import type { TagDto } from "../dtos/TagDto";
import { TagMapper } from "../mappers/TagMapper";

export class CrearTagUseCase {
	constructor(private readonly tagRepository: TagRepository) {}

	async ejecutar(usuarioId: number, dto: CrearTagDto): Promise<TagDto> {
		if (await this.tagRepository.buscarPorNombre(usuarioId, dto.nombre)) {
			throw new TagDuplicadoError();
		}
		const creado = await this.tagRepository.crear(
			Tag.crear(usuarioId, dto.nombre),
		);
		return TagMapper.toDto(creado);
	}
}
