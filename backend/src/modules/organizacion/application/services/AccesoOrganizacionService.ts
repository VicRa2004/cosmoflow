import type { AccesoOrganizacion } from "../../domain/AccesoOrganizacion";
import { OrganizacionNoEncontradaError } from "../../domain/error/OrganizacionNoEncontradaError";
import type { PermisoOrganizacion } from "../../domain/permisosOrganizacion";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import { buscarConPermiso } from "../useCases/buscarConPermiso";

export class AccesoOrganizacionService implements AccesoOrganizacion {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
	) {}

	async exigir(
		usuarioId: number,
		organizacionId: number,
		permiso?: PermisoOrganizacion,
	): Promise<void> {
		if (permiso) {
			await buscarConPermiso(
				this.organizacionRepository,
				usuarioId,
				organizacionId,
				permiso,
			);
		} else if (
			!(await this.organizacionRepository.buscarPorId(
				usuarioId,
				organizacionId,
			))
		) {
			throw new OrganizacionNoEncontradaError();
		}
	}
}
