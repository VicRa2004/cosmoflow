import { SesionNoEncontradaError } from "../../domain/error/SesionNoEncontradaError";
import type { RefreshTokenRepository } from "../../domain/repository/RefreshTokenRepository";
import type { TokenService } from "../../domain/service/TokenService";

/** Revoca una sesión individual perteneciente al usuario autenticado. */
export class RevocarSesionUseCase {
	constructor(
		private readonly tokenService: TokenService,
		private readonly refreshTokenRepository: RefreshTokenRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		sesionId: number,
		refreshTokenActual?: string,
	): Promise<{ isActual: boolean }> {
		const sesion = await this.refreshTokenRepository.buscarPorIdYUsuario(
			sesionId,
			usuarioId,
		);
		if (!sesion || sesion.revocado || sesion.expiraEn <= new Date()) {
			throw new SesionNoEncontradaError();
		}
		const revocado = await this.refreshTokenRepository.revocarPorId(sesionId);
		if (!revocado) {
			throw new SesionNoEncontradaError();
		}
		const hashActual = refreshTokenActual
			? this.tokenService.hashearRefreshToken(refreshTokenActual)
			: null;
		return {
			isActual: hashActual !== null && sesion.tokenHash === hashActual,
		};
	}
}
