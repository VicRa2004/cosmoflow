import type { AccesoOrganizacion } from "@/modules/organizacion";
import { TagDuplicadoError } from "../../domain/error/TagDuplicadoError";
import { TagNoEncontradoError } from "../../domain/error/TagNoEncontradoError";
import type { TagRepository } from "../../domain/repository/TagRepository";
import type { ActualizarTagDto } from "../dtos/ActualizarTagDto";
import type { TagDto } from "../dtos/TagDto";
import { TagMapper } from "../mappers/TagMapper";
import { type AmbitoTag, resolverDueno } from "../resolverDueno";

export class ActualizarTagUseCase {
	constructor(
		private readonly tagRepository: TagRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		ambito: AmbitoTag,
		id: number,
		dto: ActualizarTagDto,
	): Promise<TagDto> {
		const dueno = await resolverDueno(this.acceso, ambito, true);
		const tag = await this.tagRepository.buscarPorId(dueno, id);
		if (!tag) {
			throw new TagNoEncontradoError();
		}
		if (dto.nombre !== undefined) {
			const mismoNombre = await this.tagRepository.buscarPorNombre(
				dueno,
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
