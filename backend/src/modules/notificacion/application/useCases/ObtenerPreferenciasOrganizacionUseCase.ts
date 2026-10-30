import type { AccesoOrganizacion } from "@/modules/organizacion";
import { type Preferencia, resolverPreferencias } from "../../domain/catalogo";
import type { NotificacionRepository } from "../../domain/repository/NotificacionRepository";

/** Valores por defecto de la organización para sus miembros; los ve cualquier miembro. */
export class ObtenerPreferenciasOrganizacionUseCase {
	constructor(
		private readonly repo: NotificacionRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
	): Promise<Preferencia[]> {
		await this.acceso.exigir(usuarioId, organizacionId);
		return resolverPreferencias(
			await this.repo.preferenciasOrganizacion(organizacionId),
		);
	}
}
