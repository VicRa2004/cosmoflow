import {
	PREFERENCIAS_PREDETERMINADAS,
	type PreferenciasInterfaz,
} from "../../domain/PreferenciasInterfaz";
import type { PreferenciaRepository } from "../../domain/repository/PreferenciaRepository";

/** Las del usuario, con las predeterminadas en lo que no eligió. */
export class ObtenerPreferenciasInterfazUseCase {
	constructor(private readonly repo: PreferenciaRepository) {}

	async ejecutar(usuarioId: number): Promise<PreferenciasInterfaz> {
		return {
			...PREFERENCIAS_PREDETERMINADAS,
			...(await this.repo.obtener(usuarioId)),
		};
	}
}
