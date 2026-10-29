import { RolDuplicadoError } from "../../domain/error/RolDuplicadoError";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { RolOrganizacionRepository } from "../../domain/repository/RolOrganizacionRepository";
import type {
	GuardarRolDto,
	RolOrganizacionDto,
} from "../dtos/RolOrganizacionDto";
import { RolOrganizacionMapper } from "../mappers/RolOrganizacionMapper";
import { buscarRolGestionable } from "./buscarRolGestionable";

export class ActualizarRolUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly rolRepository: RolOrganizacionRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
		rolId: number,
		dto: GuardarRolDto,
	): Promise<RolOrganizacionDto> {
		const rol = await buscarRolGestionable(
			{
				organizaciones: this.organizacionRepository,
				roles: this.rolRepository,
			},
			usuarioId,
			organizacionId,
			rolId,
		);
		const mismoNombre = await this.rolRepository.buscarPorNombre(
			organizacionId,
			dto.nombre,
		);
		if (mismoNombre && mismoNombre.getId() !== rolId) {
			throw new RolDuplicadoError();
		}
		rol.actualizar(dto);
		await this.rolRepository.actualizar(rol);
		return RolOrganizacionMapper.toDto(
			rol,
			await this.rolRepository.contarMiembros(rolId),
		);
	}
}
