import { type Preferencia, resolverPreferencias } from "../../domain/catalogo";
import type { NotificacionRepository } from "../../domain/repository/NotificacionRepository";

/** Las del usuario autenticado, con los valores por defecto donde no eligió. */
export class ObtenerPreferenciasUseCase {
	constructor(private readonly repo: NotificacionRepository) {}

	async ejecutar(usuarioId: number): Promise<Preferencia[]> {
		return resolverPreferencias(await this.repo.preferencias(usuarioId));
	}
}
