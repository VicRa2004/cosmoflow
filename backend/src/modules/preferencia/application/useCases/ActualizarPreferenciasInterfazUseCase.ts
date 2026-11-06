import type { PreferenciasInterfaz } from "../../domain/PreferenciasInterfaz";
import type { PreferenciaRepository } from "../../domain/repository/PreferenciaRepository";
import type { ObtenerPreferenciasInterfazUseCase } from "./ObtenerPreferenciasInterfazUseCase";

/** Cambia solo las enviadas; devuelve todas. */
export class ActualizarPreferenciasInterfazUseCase {
	constructor(
		private readonly repo: PreferenciaRepository,
		private readonly obtener: ObtenerPreferenciasInterfazUseCase,
	) {}

	async ejecutar(
		usuarioId: number,
		cambios: Partial<PreferenciasInterfaz>,
	): Promise<PreferenciasInterfaz> {
		const datos = { ...(await this.obtener.ejecutar(usuarioId)), ...cambios };
		await this.repo.guardar(usuarioId, datos);
		return datos;
	}
}
