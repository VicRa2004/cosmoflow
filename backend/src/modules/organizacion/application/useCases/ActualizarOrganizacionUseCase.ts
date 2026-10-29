import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { ActualizarOrganizacionDto } from "../dtos/ActualizarOrganizacionDto";
import type { OrganizacionDto } from "../dtos/OrganizacionDto";
import { OrganizacionMapper } from "../mappers/OrganizacionMapper";
import { buscarConPermiso } from "./buscarConPermiso";

export class ActualizarOrganizacionUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		id: number,
		dto: ActualizarOrganizacionDto,
	): Promise<OrganizacionDto> {
		const encontrada = await buscarConPermiso(
			this.organizacionRepository,
			usuarioId,
			id,
			"organizacion:editar",
		);
		encontrada.organizacion.actualizar(dto);
		return OrganizacionMapper.toDto({
			...encontrada,
			organizacion: await this.organizacionRepository.actualizar(
				encontrada.organizacion,
			),
		});
	}
}
