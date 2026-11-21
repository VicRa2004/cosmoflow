import type { UsuarioRepository } from "@/core/usuario";
import {
	PREFIJO_REFRESH_FIJO,
	type TokenPersonalRepository,
} from "../../domain/repository/TokenPersonalRepository";
import type { TokenService } from "../../domain/service/TokenService";
import { generarCredenciales, type TokensConexion } from "./tokensConexion";

/**
 * Canjea el refresh token de una conexión por otro par (rotación): el refresh
 * usado y el acceso anterior dejan de valer. `null` si no es válido.
 * Un refresh `PREFIJO_REFRESH_FIJO` (Gemini) se conserva: solo cambia el acceso.
 * shortcut: reusar un refresh ya rotado solo falla, no revoca la conexión; detectar el robo si hiciera falta.
 */
export class RenovarTokensConexionUseCase {
	constructor(
		private readonly tokenService: TokenService,
		private readonly repo: TokenPersonalRepository,
		private readonly usuarios: UsuarioRepository,
	) {}

	async ejecutar(
		refreshToken: string,
		clientId: string,
	): Promise<TokensConexion | null> {
		const { tokens, credenciales } = generarCredenciales(
			this.tokenService,
			refreshToken.startsWith(PREFIJO_REFRESH_FIJO) ? refreshToken : undefined,
		);
		const usuarioId = await this.repo.rotar(
			this.tokenService.hashearRefreshToken(refreshToken),
			clientId,
			credenciales,
		);
		if (usuarioId === null) return null;
		// Como al autenticar: un usuario borrado o desactivado no renueva.
		const usuario = await this.usuarios.buscarPorId(usuarioId);
		return usuario?.getIsActivo() ? tokens : null;
	}
}
