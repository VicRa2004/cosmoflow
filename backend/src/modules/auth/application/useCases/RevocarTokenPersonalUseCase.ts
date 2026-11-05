import { TokenPersonalNoEncontradoError } from "../../domain/error/TokenPersonalNoEncontradoError";
import type { TokenPersonalRepository } from "../../domain/repository/TokenPersonalRepository";

export class RevocarTokenPersonalUseCase {
	constructor(private readonly repo: TokenPersonalRepository) {}

	async ejecutar(usuarioId: number, id: number): Promise<void> {
		if (!(await this.repo.revocar(id, usuarioId))) {
			throw new TokenPersonalNoEncontradoError();
		}
	}
}
