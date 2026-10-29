import { RolDuplicadoError } from "../../domain/error/RolDuplicadoError";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { RolOrganizacionRepository } from "../../domain/repository/RolOrganizacionRepository";
import { RolOrganizacion } from "../../domain/RolOrganizacion";
import type {
	GuardarRolDto,
	RolOrganizacionDto,
} from "../dtos/RolOrganizacionDto";
import { RolOrganizacionMapper } from "../mappers/RolOrganizacionMapper";
import { buscarConPermiso } from "./buscarConPermiso";

/** Desde cero o copiando una plantilla: la interfaz rellena los permisos (RN-17). */
export class CrearRolUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly rolRepository: RolOrganizacionRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
		dto: GuardarRolDto,
	): Promise<RolOrganizacionDto> {
		await buscarConPermiso(
			this.organizacionRepository,
			usuarioId,
			organizacionId,
			"roles:gestionar",
		);
		if (await this.rolRepository.buscarPorNombre(organizacionId, dto.nombre)) {
			throw new RolDuplicadoError();
		}
		const creado = await this.rolRepository.crear(
			RolOrganizacion.crear(organizacionId, dto.nombre, dto.permisos),
		);
		return RolOrganizacionMapper.toDto(creado, 0);
	}
}
