import type { RefreshTokenRepository } from "../../domain/repository/RefreshTokenRepository";
import type { TokenService } from "../../domain/service/TokenService";
import type { SesionDto } from "../dtos/SesionDto";

/** Lista las sesiones activas (refresh tokens vigentes) del usuario autenticado. */
export class ObtenerSesionesUseCase {
	constructor(
		private readonly tokenService: TokenService,
		private readonly refreshTokenRepository: RefreshTokenRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		refreshTokenActual?: string,
	): Promise<SesionDto[]> {
		const hashActual = refreshTokenActual
			? this.tokenService.hashearRefreshToken(refreshTokenActual)
			: null;
		const sesiones =
			await this.refreshTokenRepository.listarActivosPorUsuario(usuarioId);
		return sesiones.map((s) => ({
			id: s.id,
			createdAt: s.createdAt.toISOString(),
			expiraEn: s.expiraEn.toISOString(),
			isActual: hashActual !== null && s.tokenHash === hashActual,
		}));
	}
}
