import type { AccesoOrganizacion } from "@/modules/organizacion";
import { TagDuplicadoError } from "../../domain/error/TagDuplicadoError";
import type { TagRepository } from "../../domain/repository/TagRepository";
import { Tag } from "../../domain/Tag";
import type { CrearTagDto } from "../dtos/CrearTagDto";
import type { TagDto } from "../dtos/TagDto";
import { TagMapper } from "../mappers/TagMapper";
import { type AmbitoTag, resolverDueno } from "../resolverDueno";

export class CrearTagUseCase {
	constructor(
		private readonly tagRepository: TagRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(ambito: AmbitoTag, dto: CrearTagDto): Promise<TagDto> {
		const dueno = await resolverDueno(this.acceso, ambito, true);
		if (await this.tagRepository.buscarPorNombre(dueno, dto.nombre)) {
			throw new TagDuplicadoError();
		}
		const creado = await this.tagRepository.crear(Tag.crear(dueno, dto.nombre));
		return TagMapper.toDto(creado);
	}
}
