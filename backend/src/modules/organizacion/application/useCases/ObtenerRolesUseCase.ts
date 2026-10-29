import { OrganizacionNoEncontradaError } from "../../domain/error/OrganizacionNoEncontradaError";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { RolOrganizacionRepository } from "../../domain/repository/RolOrganizacionRepository";
import type { RolOrganizacionDto } from "../dtos/RolOrganizacionDto";
import { RolOrganizacionMapper } from "../mappers/RolOrganizacionMapper";

/** Cualquier miembro ve los roles; gestionarlos pide `roles:gestionar`. */
export class ObtenerRolesUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly rolRepository: RolOrganizacionRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
	): Promise<RolOrganizacionDto[]> {
		if (
			!(await this.organizacionRepository.buscarPorId(
				usuarioId,
				organizacionId,
			))
		) {
			throw new OrganizacionNoEncontradaError();
		}
		const roles = await this.rolRepository.buscar(organizacionId);
		return roles.map(({ rol, totalMiembros }) =>
			RolOrganizacionMapper.toDto(rol, totalMiembros),
		);
	}
}
