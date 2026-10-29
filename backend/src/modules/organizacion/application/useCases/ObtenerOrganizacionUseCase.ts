import { OrganizacionNoEncontradaError } from "../../domain/error/OrganizacionNoEncontradaError";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { OrganizacionDto } from "../dtos/OrganizacionDto";
import { OrganizacionMapper } from "../mappers/OrganizacionMapper";

export class ObtenerOrganizacionUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
	) {}

	async ejecutar(usuarioId: number, id: number): Promise<OrganizacionDto> {
		const encontrada = await this.organizacionRepository.buscarPorId(
			usuarioId,
			id,
		);
		if (!encontrada) {
			throw new OrganizacionNoEncontradaError();
		}
		return OrganizacionMapper.toDto(encontrada);
	}
}
