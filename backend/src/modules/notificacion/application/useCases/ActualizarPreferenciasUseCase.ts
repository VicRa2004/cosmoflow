import { type Preferencia, resolverPreferencias } from "../../domain/catalogo";
import type { NotificacionRepository } from "../../domain/repository/NotificacionRepository";

/** Guarda las enviadas (las demás no cambian) y devuelve la matriz completa. */
export class ActualizarPreferenciasUseCase {
	constructor(private readonly repo: NotificacionRepository) {}

	async ejecutar(
		usuarioId: number,
		preferencias: Preferencia[],
	): Promise<Preferencia[]> {
		await this.repo.guardarPreferencias(usuarioId, preferencias);
		return resolverPreferencias(await this.repo.preferencias(usuarioId));
	}
}
