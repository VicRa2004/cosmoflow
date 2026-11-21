import {
	PREFIJO_REFRESH_FIJO,
	type TokenPersonalRepository,
} from "../../domain/repository/TokenPersonalRepository";
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
		/** El refresh no rotará al renovar (lo exige Gemini). */
		refreshFijo?: boolean;
	}): Promise<TokensConexion> {
		const { refreshFijo, ...conexion } = dto;
		const { tokens, credenciales } = generarCredenciales(
			this.tokenService,
			refreshFijo
				? `${PREFIJO_REFRESH_FIJO}${this.tokenService.generarRefreshToken()}`
				: undefined,
		);
		await this.repo.crearConexion({ ...conexion, ...credenciales });
		return tokens;
	}
}
