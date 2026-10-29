import type { AccesoOrganizacion } from "@/modules/organizacion";
import { TagNoEncontradoError } from "../../domain/error/TagNoEncontradoError";
import type { TagRepository } from "../../domain/repository/TagRepository";
import type { TagDto } from "../dtos/TagDto";
import { TagMapper } from "../mappers/TagMapper";
import { type AmbitoTag, resolverDueno } from "../resolverDueno";

export class ObtenerTagUseCase {
	constructor(
		private readonly tagRepository: TagRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(ambito: AmbitoTag, id: number): Promise<TagDto> {
		const dueno = await resolverDueno(this.acceso, ambito, false);
		const tag = await this.tagRepository.buscarPorId(dueno, id);
		if (!tag) {
			throw new TagNoEncontradoError();
		}
		return TagMapper.toDto(tag);
	}
}
