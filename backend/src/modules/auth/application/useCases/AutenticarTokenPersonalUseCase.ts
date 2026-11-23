import type { UsuarioRepository } from "@/core/usuario";
import type { Alcance } from "../../domain/alcances";
import type { TokenPersonalRepository } from "../../domain/repository/TokenPersonalRepository";
import type {
	AccessTokenPayload,
	TokenService,
} from "../../domain/service/TokenService";

/** «Último uso» con precisión de minutos: no se escribe en BD en cada petición. */
const INTERVALO_ULTIMO_USO_MS = 5 * 60 * 1000;

/**
 * Resuelve el token al usuario actual en cada petición: revocarlo, borrar o
 * desactivar al usuario lo invalida al instante, y los roles nunca quedan atrasados.
 */
export class AutenticarTokenPersonalUseCase {
	constructor(
		private readonly tokenService: TokenService,
		private readonly repo: TokenPersonalRepository,
		private readonly usuarios: UsuarioRepository,
	) {}

	async ejecutar(
		token: string,
	): Promise<(AccessTokenPayload & { alcances: Alcance[] | null }) | null> {
		const registro = await this.repo.buscarPorHash(
			this.tokenService.hashearRefreshToken(token),
		);
		if (!registro) return null;

		const usuario = await this.usuarios.buscarPorId(registro.usuarioId);
		if (!usuario?.getIsActivo()) return null;

		const ahora = new Date();
		if (
			!registro.ultimoUsoEn ||
			ahora.getTime() - registro.ultimoUsoEn.getTime() > INTERVALO_ULTIMO_USO_MS
		) {
			await this.repo.marcarUso(registro.id, ahora);
		}

		return {
			id: usuario.getId(),
			email: usuario.getEmail(),
			roles: usuario.getRoles(),
			alcances: registro.alcances,
		};
	}
}
