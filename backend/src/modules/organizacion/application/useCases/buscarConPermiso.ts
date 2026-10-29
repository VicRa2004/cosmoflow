import { OrganizacionNoEncontradaError } from "../../domain/error/OrganizacionNoEncontradaError";
import { SinPermisoOrganizacionError } from "../../domain/error/SinPermisoOrganizacionError";
import { SoloAdminOrganizacionError } from "../../domain/error/SoloAdminOrganizacionError";
import {
	type PermisoOrganizacion,
	permisosEfectivos,
} from "../../domain/permisosOrganizacion";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";

/**
 * 404 si no es miembro (no se revela que existe); 403 si es miembro sin el permiso.
 * `"admin"` es para lo que ningún rol puede dar: eliminar la organización y delegarla.
 */
export async function buscarConPermiso(
	repo: OrganizacionRepository,
	usuarioId: number,
	id: number,
	permiso: PermisoOrganizacion | "admin",
) {
	const encontrada = await repo.buscarPorId(usuarioId, id);
	if (!encontrada) throw new OrganizacionNoEncontradaError();
	if (permiso === "admin") {
		if (!encontrada.isAdmin) throw new SoloAdminOrganizacionError();
	} else if (!permisosEfectivos(encontrada).includes(permiso)) {
		throw new SinPermisoOrganizacionError();
	}
	return encontrada;
}
