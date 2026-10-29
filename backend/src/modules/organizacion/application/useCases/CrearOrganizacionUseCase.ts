import { Organizacion } from "../../domain/Organizacion";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { CrearOrganizacionDto } from "../dtos/CrearOrganizacionDto";
import type { OrganizacionDto } from "../dtos/OrganizacionDto";
import { OrganizacionMapper } from "../mappers/OrganizacionMapper";

export class CrearOrganizacionUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		dto: CrearOrganizacionDto,
	): Promise<OrganizacionDto> {
		const creada = await this.organizacionRepository.crear(
			Organizacion.crear(dto),
			usuarioId,
		);
		return OrganizacionMapper.toDto({ organizacion: creada, isAdmin: true });
	}
}
