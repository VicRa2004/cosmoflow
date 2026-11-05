import type {
	TokenPersonal,
	TokenPersonalRepository,
} from "../../domain/repository/TokenPersonalRepository";

export class ObtenerTokensPersonalesUseCase {
	constructor(private readonly repo: TokenPersonalRepository) {}

	ejecutar(usuarioId: number): Promise<TokenPersonal[]> {
		return this.repo.listar(usuarioId);
	}
}
