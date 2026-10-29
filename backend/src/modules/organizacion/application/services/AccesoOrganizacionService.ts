import type { AccesoOrganizacion } from "../../domain/AccesoOrganizacion";
import { OrganizacionNoEncontradaError } from "../../domain/error/OrganizacionNoEncontradaError";
import {
	type PermisoOrganizacion,
	permisosEfectivos,
} from "../../domain/permisosOrganizacion";
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
	): Promise<PermisoOrganizacion[]> {
		const miembro = permiso
			? await buscarConPermiso(
					this.organizacionRepository,
					usuarioId,
					organizacionId,
					permiso,
				)
			: await this.organizacionRepository.buscarPorId(
					usuarioId,
					organizacionId,
				);
		if (!miembro) throw new OrganizacionNoEncontradaError();
		return permisosEfectivos(miembro);
	}
}
