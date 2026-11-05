import {
	PREFIJO_TOKEN_PERSONAL,
	type TokenPersonal,
	type TokenPersonalRepository,
} from "../../domain/repository/TokenPersonalRepository";
import type { TokenService } from "../../domain/service/TokenService";

/** El token en claro solo existe en esta respuesta: en BD queda su hash. */
export class CrearTokenPersonalUseCase {
	constructor(
		private readonly tokenService: TokenService,
		private readonly repo: TokenPersonalRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		nombre: string,
	): Promise<TokenPersonal & { token: string }> {
		const aleatorio = this.tokenService.generarRefreshToken();
		const token = `${PREFIJO_TOKEN_PERSONAL}${aleatorio}`;
		const creado = await this.repo.crear({
			nombre,
			tokenHash: this.tokenService.hashearRefreshToken(token),
			pista: aleatorio.slice(-4),
			usuarioId,
		});
		return { ...creado, token };
	}
}
