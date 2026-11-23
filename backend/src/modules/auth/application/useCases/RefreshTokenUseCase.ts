import { BaseError } from "@/core/shared/domain/error/BaseError";
import {
	type UsuarioDto,
	UsuarioMapper,
	type UsuarioRepository,
} from "@/core/usuario";
import type { TokenService } from "../../domain/service/TokenService";
import type { RefreshTokenRepository } from "../../domain/repository/RefreshTokenRepository";
import { EmisorSesion } from "../services/EmisorSesion";

/** Margen en que el refresh token ya rotado sigue valiendo (respuestas perdidas, carreras entre pestañas). */
const SEGUNDOS_GRACIA_ROTACION = 120;

type ResultadoRefresh = {
	accessToken: string;
	refreshToken: string;
	usuario: UsuarioDto;
};

export class RefreshTokenUseCase {
	/** Deduplica peticiones concurrentes con el mismo hash mientras la rotación está en curso. */
	private readonly enVuelo = new Map<string, Promise<ResultadoRefresh>>();

	constructor(
		private readonly tokenService: TokenService,
		private readonly refreshTokenRepo: RefreshTokenRepository,
		private readonly usuarioRepository: UsuarioRepository,
		private readonly emisorSesion: EmisorSesion,
	) {}

	/**
	 * Rota el refresh token: emite un par nuevo y deja el usado vivo solo
	 * `SEGUNDOS_GRACIA_ROTACION` más.
	 *
	 * No se revocan las demás sesiones al reutilizar un token ya rotado: una
	 * respuesta perdida (recarga, app suspendida, red móvil) lo hace a menudo y
	 * cerraba la sesión en todos los dispositivos. Las peticiones concurrentes en
	 * este proceso comparten la misma rotación para no crear sesiones de más.
	 */
	async ejecutar(refreshTokenActual: string): Promise<ResultadoRefresh> {
		const tokenHash = this.tokenService.hashearRefreshToken(refreshTokenActual);
		const pendiente = this.enVuelo.get(tokenHash);
		if (pendiente) return pendiente;

		const operacion = this.rotar(tokenHash).finally(() => {
			this.enVuelo.delete(tokenHash);
		});
		this.enVuelo.set(tokenHash, operacion);
		return operacion;
	}

	private async rotar(tokenHash: string): Promise<ResultadoRefresh> {
		const tokenGuardado =
			await this.refreshTokenRepo.buscarValidoPorHash(tokenHash);

		if (!tokenGuardado) {
			throw new BaseError("Refresh token inválido o expirado", 401);
		}

		const usuario = await this.usuarioRepository.buscarPorId(
			tokenGuardado.usuarioId,
		);

		if (!usuario?.getIsActivo()) {
			throw new BaseError("Usuario no encontrado o inactivo", 401);
		}

		await this.refreshTokenRepo.caducarEn(
			tokenGuardado.id,
			new Date(Date.now() + SEGUNDOS_GRACIA_ROTACION * 1000),
		);

		// El usuario va en la respuesta: la SPA lo necesita al volver del login con Google.
		return {
			...(await this.emisorSesion.emitir(usuario)),
			usuario: UsuarioMapper.toDto(usuario),
		};
	}
}
