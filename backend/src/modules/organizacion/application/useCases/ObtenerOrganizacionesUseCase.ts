import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { ObtenerOrganizacionesDto } from "../dtos/ObtenerOrganizacionesDto";
import type { OrganizacionDto } from "../dtos/OrganizacionDto";
import { OrganizacionMapper } from "../mappers/OrganizacionMapper";

/** Las organizaciones de las que el usuario es miembro. */
export class ObtenerOrganizacionesUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		dto: ObtenerOrganizacionesDto,
	): Promise<Paginacion<OrganizacionDto>> {
		const resultado = await this.organizacionRepository.buscar(usuarioId, dto);
		return {
			...resultado,
			datos: resultado.datos.map(OrganizacionMapper.toDto),
		};
	}
}
