import { MiembroNoEncontradoError } from "../../domain/error/MiembroNoEncontradoError";
import { RolNoEncontradoError } from "../../domain/error/RolNoEncontradoError";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { RolOrganizacionRepository } from "../../domain/repository/RolOrganizacionRepository";
import { buscarConPermiso } from "./buscarConPermiso";

/** Reemplaza los roles de un miembro (RN-14: varios, o ninguno). */
export class AsignarRolesUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly rolRepository: RolOrganizacionRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
		objetivoId: number,
		rolIds: number[],
	): Promise<void> {
		await buscarConPermiso(
			this.organizacionRepository,
			usuarioId,
			organizacionId,
			"roles:gestionar",
		);
		if (
			!(await this.organizacionRepository.buscarPorId(
				objetivoId,
				organizacionId,
			))
		) {
			throw new MiembroNoEncontradoError();
		}
		const ids = [...new Set(rolIds)];
		if (!(await this.rolRepository.sonRolesDe(organizacionId, ids))) {
			throw new RolNoEncontradoError();
		}
		await this.rolRepository.asignar(organizacionId, objetivoId, ids);
	}
}
