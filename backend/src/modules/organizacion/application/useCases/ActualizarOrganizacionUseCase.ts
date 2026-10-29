import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { ActualizarOrganizacionDto } from "../dtos/ActualizarOrganizacionDto";
import type { OrganizacionDto } from "../dtos/OrganizacionDto";
import { OrganizacionMapper } from "../mappers/OrganizacionMapper";
import { buscarComoAdmin } from "./buscarComoAdmin";

export class ActualizarOrganizacionUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		id: number,
		dto: ActualizarOrganizacionDto,
	): Promise<OrganizacionDto> {
		const organizacion = await buscarComoAdmin(
			this.organizacionRepository,
			usuarioId,
			id,
		);
		organizacion.actualizar(dto);
		return OrganizacionMapper.toDto({
			organizacion: await this.organizacionRepository.actualizar(organizacion),
			isAdmin: true,
		});
	}
}
