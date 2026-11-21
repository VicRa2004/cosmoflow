import type { Usuario } from "@/core/usuario";
import type { TokenService } from "../../domain/service/TokenService";
import type { RefreshTokenRepository } from "../../domain/repository/RefreshTokenRepository";

/** Duración del refresh token: 30 días (se renueva con cada uso). */
export const DIAS_EXPIRACION_REFRESH_TOKEN = 30;

/**
 * Emite una sesión nueva para un usuario: access token de 1 hora
 * y refresh token opaco persistido como hash en BD.
 */
export class EmisorSesion {
	constructor(
		private readonly tokenService: TokenService,
		private readonly refreshTokenRepo: RefreshTokenRepository,
	) {}

	async emitir(
		usuario: Usuario,
	): Promise<{ accessToken: string; refreshToken: string }> {
		const accessToken = this.tokenService.generarToken({
			id: usuario.getId(),
			email: usuario.getEmail(),
			roles: usuario.getRoles(),
		});

		const refreshToken = this.tokenService.generarRefreshToken();

		const expiraEn = new Date();
		expiraEn.setDate(expiraEn.getDate() + DIAS_EXPIRACION_REFRESH_TOKEN);

		await this.refreshTokenRepo.crear({
			tokenHash: this.tokenService.hashearRefreshToken(refreshToken),
			usuarioId: usuario.getId(),
			expiraEn,
		});

		return { accessToken, refreshToken };
	}
}
