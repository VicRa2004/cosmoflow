import {
	type PreferenciaUsuario,
	preferenciasDeUsuario,
} from "../../domain/catalogo";
import type { NotificacionRepository } from "../../domain/repository/NotificacionRepository";

/** Las del usuario autenticado, con los valores por defecto donde no eligió. */
export class ObtenerPreferenciasUseCase {
	constructor(private readonly repo: NotificacionRepository) {}

	async ejecutar(usuarioId: number): Promise<PreferenciaUsuario[]> {
		return preferenciasDeUsuario(await this.repo.preferencias(usuarioId));
	}
}
