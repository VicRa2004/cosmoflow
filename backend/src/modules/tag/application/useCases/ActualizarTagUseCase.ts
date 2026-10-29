import { TagDuplicadoError } from "../../domain/error/TagDuplicadoError";
import { TagNoEncontradoError } from "../../domain/error/TagNoEncontradoError";
import type { TagRepository } from "../../domain/repository/TagRepository";
import type { ActualizarTagDto } from "../dtos/ActualizarTagDto";
import type { TagDto } from "../dtos/TagDto";
import { TagMapper } from "../mappers/TagMapper";

export class ActualizarTagUseCase {
	constructor(private readonly tagRepository: TagRepository) {}

	async ejecutar(
		usuarioId: number,
		id: number,
		dto: ActualizarTagDto,
	): Promise<TagDto> {
		const tag = await this.tagRepository.buscarPorId(usuarioId, id);
		if (!tag) {
			throw new TagNoEncontradoError();
		}
		if (dto.nombre !== undefined) {
			const mismoNombre = await this.tagRepository.buscarPorNombre(
				usuarioId,
				dto.nombre,
			);
			if (mismoNombre && mismoNombre.getId() !== id) {
				throw new TagDuplicadoError();
			}
		}
		tag.actualizar(dto);
		return TagMapper.toDto(await this.tagRepository.actualizar(tag));
	}
}
