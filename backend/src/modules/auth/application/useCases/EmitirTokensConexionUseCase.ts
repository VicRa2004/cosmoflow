import type { TokenPersonalRepository } from "../../domain/repository/TokenPersonalRepository";
import type { TokenService } from "../../domain/service/TokenService";
import { generarCredenciales, type TokensConexion } from "./tokensConexion";

/**
 * Crea una conexión OAuth (MCP): un token personal que caduca y se renueva con su
 * refresh token. Aparece en el perfil y se revoca como cualquier otro.
 */
export class EmitirTokensConexionUseCase {
	constructor(
		private readonly tokenService: TokenService,
		private readonly repo: TokenPersonalRepository,
	) {}

	async ejecutar(dto: {
		usuarioId: number;
		nombre: string;
		clientId: string;
	}): Promise<TokensConexion> {
		const { tokens, credenciales } = generarCredenciales(this.tokenService);
		await this.repo.crearConexion({ ...dto, ...credenciales });
		return tokens;
	}
}
