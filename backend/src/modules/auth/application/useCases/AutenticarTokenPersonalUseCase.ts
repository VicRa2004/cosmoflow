import type { UsuarioRepository } from "@/core/usuario";
import type { TokenPersonalRepository } from "../../domain/repository/TokenPersonalRepository";
import type {
	AccessTokenPayload,
	TokenService,
} from "../../domain/service/TokenService";

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

	async ejecutar(token: string): Promise<AccessTokenPayload | null> {
		const usuarioId = await this.repo.buscarUsuarioIdPorHash(
			this.tokenService.hashearRefreshToken(token),
		);
		if (usuarioId === null) return null;

		const usuario = await this.usuarios.buscarPorId(usuarioId);
		if (!usuario?.getIsActivo()) return null;

		return {
			id: usuario.getId(),
			email: usuario.getEmail(),
			roles: usuario.getRoles(),
		};
	}
}
