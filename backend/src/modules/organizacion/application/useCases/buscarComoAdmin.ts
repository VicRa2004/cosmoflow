import { OrganizacionNoEncontradaError } from "../../domain/error/OrganizacionNoEncontradaError";
import { SoloAdminOrganizacionError } from "../../domain/error/SoloAdminOrganizacionError";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";

/** 404 si no es miembro (no se revela que existe), 403 si es miembro sin ser admin. */
export async function buscarComoAdmin(
	repo: OrganizacionRepository,
	usuarioId: number,
	id: number,
) {
	const encontrada = await repo.buscarPorId(usuarioId, id);
	if (!encontrada) throw new OrganizacionNoEncontradaError();
	if (!encontrada.isAdmin) throw new SoloAdminOrganizacionError();
	return encontrada.organizacion;
}
