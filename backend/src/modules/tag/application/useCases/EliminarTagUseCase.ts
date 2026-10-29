import type { AccesoOrganizacion } from "@/modules/organizacion";
import { TagNoEncontradoError } from "../../domain/error/TagNoEncontradoError";
import type { TagRepository } from "../../domain/repository/TagRepository";
import { type AmbitoTag, resolverDueno } from "../resolverDueno";

export class EliminarTagUseCase {
	constructor(
		private readonly tagRepository: TagRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(ambito: AmbitoTag, id: number): Promise<void> {
		const dueno = await resolverDueno(this.acceso, ambito, true);
		if (!(await this.tagRepository.buscarPorId(dueno, id))) {
			throw new TagNoEncontradoError();
		}
		await this.tagRepository.eliminar(id);
	}
}
