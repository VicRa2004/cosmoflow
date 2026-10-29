import { TagNoEncontradoError } from "../../domain/error/TagNoEncontradoError";
import type { TagRepository } from "../../domain/repository/TagRepository";
import type { TagDto } from "../dtos/TagDto";
import { TagMapper } from "../mappers/TagMapper";

export class ObtenerTagUseCase {
	constructor(private readonly tagRepository: TagRepository) {}

	async ejecutar(usuarioId: number, id: number): Promise<TagDto> {
		const tag = await this.tagRepository.buscarPorId(usuarioId, id);
		if (!tag) {
			throw new TagNoEncontradoError();
		}
		return TagMapper.toDto(tag);
	}
}
