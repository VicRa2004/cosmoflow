import type { TagRepository } from "../../domain/repository/TagRepository";
import type { ObtenerTagsDto } from "../dtos/ObtenerTagsDto";
import type { TagDto } from "../dtos/TagDto";
import type { Paginacion } from "@/core/shared/domain/Paginacion";
import { TagMapper } from "../mappers/TagMapper";

export class ObtenerTagsUseCase {
	constructor(private readonly tagRepository: TagRepository) {}

	async ejecutar(
		usuarioId: number,
		dto: ObtenerTagsDto,
	): Promise<Paginacion<TagDto>> {
		const resultado = await this.tagRepository.buscar(usuarioId, dto);
		return { ...resultado, datos: resultado.datos.map(TagMapper.toDto) };
	}
}
