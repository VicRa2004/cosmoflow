import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { RolOrganizacionRepository } from "../../domain/repository/RolOrganizacionRepository";
import { buscarRolGestionable } from "./buscarRolGestionable";

/** Quien lo tuviera pierde sus permisos en ese momento. */
export class EliminarRolUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly rolRepository: RolOrganizacionRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
		rolId: number,
	): Promise<void> {
		await buscarRolGestionable(
			{
				organizaciones: this.organizacionRepository,
				roles: this.rolRepository,
			},
			usuarioId,
			organizacionId,
			rolId,
		);
		await this.rolRepository.eliminar(organizacionId, rolId);
	}
}
