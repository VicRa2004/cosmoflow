import type { Alcance } from "../../domain/alcances";
import { TokenPersonalNoEncontradoError } from "../../domain/error/TokenPersonalNoEncontradoError";
import type { TokenPersonalRepository } from "../../domain/repository/TokenPersonalRepository";

/** `null` devuelve el acceso completo. Se aplica en la siguiente petición del token. */
export class CambiarAlcancesTokenPersonalUseCase {
	constructor(private readonly repo: TokenPersonalRepository) {}

	async ejecutar(
		usuarioId: number,
		id: number,
		alcances: Alcance[] | null,
	): Promise<void> {
		if (!(await this.repo.cambiarAlcances(id, usuarioId, alcances))) {
			throw new TokenPersonalNoEncontradoError();
		}
	}
}
