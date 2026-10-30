import type { AccesoOrganizacion } from "@/modules/organizacion";
import { type Preferencia, resolverPreferencias } from "../../domain/catalogo";
import type { NotificacionRepository } from "../../domain/repository/NotificacionRepository";

/** RN-92: solo con `organizacion:editar`. No pisa lo que cada miembro eligió. */
export class ActualizarPreferenciasOrganizacionUseCase {
	constructor(
		private readonly repo: NotificacionRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
		preferencias: Preferencia[],
	): Promise<Preferencia[]> {
		await this.acceso.exigir(usuarioId, organizacionId, "organizacion:editar");
		await this.repo.guardarPreferenciasOrganizacion(
			organizacionId,
			preferencias,
		);
		return resolverPreferencias(
			await this.repo.preferenciasOrganizacion(organizacionId),
		);
	}
}
