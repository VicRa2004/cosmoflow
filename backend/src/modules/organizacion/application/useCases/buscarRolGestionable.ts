import { RolNoEncontradoError } from "../../domain/error/RolNoEncontradoError";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { RolOrganizacionRepository } from "../../domain/repository/RolOrganizacionRepository";
import { buscarConPermiso } from "./buscarConPermiso";

/** Para editar o borrar: con `roles:gestionar` y el rol de esta organización. */
export async function buscarRolGestionable(
	repos: {
		organizaciones: OrganizacionRepository;
		roles: RolOrganizacionRepository;
	},
	usuarioId: number,
	organizacionId: number,
	rolId: number,
) {
	await buscarConPermiso(
		repos.organizaciones,
		usuarioId,
		organizacionId,
		"roles:gestionar",
	);
	const rol = await repos.roles.buscarPorId(organizacionId, rolId);
	if (!rol) throw new RolNoEncontradoError();
	return rol;
}
