import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { TagRepository } from "../../domain/repository/TagRepository";
import type { ObtenerTagsDto } from "../dtos/ObtenerTagsDto";
import type { TagDto } from "../dtos/TagDto";
import { TagMapper } from "../mappers/TagMapper";
import { type AmbitoTag, resolverDueno } from "../resolverDueno";

export class ObtenerTagsUseCase {
	constructor(
		private readonly tagRepository: TagRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		ambito: AmbitoTag,
		dto: ObtenerTagsDto,
	): Promise<Paginacion<TagDto>> {
		const dueno = await resolverDueno(this.acceso, ambito, false);
		const resultado = await this.tagRepository.buscar(dueno, dto);
		return { ...resultado, datos: resultado.datos.map(TagMapper.toDto) };
	}
}
