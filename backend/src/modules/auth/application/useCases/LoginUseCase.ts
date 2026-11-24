import type { LoginDto } from "../dtos/LoginDto";
import { BaseError } from "@/core/shared/domain/error/BaseError";
import type { UsuarioRepository } from "@/core/usuario";
import type { PasswordHasher } from "@/core/usuario";
import { EmisorSesion } from "../services/EmisorSesion";
import type { UsuarioDto } from "@/core/usuario";
import { UsuarioMapper } from "@/core/usuario";
import type { CuentaRepository } from "../../domain/repository/CuentaRepository";
import type { DosPasosRepository } from "../../domain/repository/DosPasosRepository";
import type { TokenService } from "../../domain/service/TokenService";

/**
 * Hash bcrypt de una contraseña aleatoria: si el email no existe se compara
 * igualmente contra él, para que la respuesta tarde lo mismo.
 */
const HASH_PASSWORD_FICTICIO =
	"$2b$10$UZQKZ7yo9nGiqhSbmYdj4eV9jrthslRlUx4lX.r5eMN.sW4Pb.boi";

/** Bloqueo por cuenta (además del rate limit por IP): frena ataques distribuidos. */
export const POLITICA_BLOQUEO = { maxIntentos: 5, bloqueoMs: 15 * 60 * 1000 };

export class LoginUseCase {
	constructor(
		private readonly usuarioRepository: UsuarioRepository,
		private readonly passwordHasher: PasswordHasher,
		private readonly emisorSesion: EmisorSesion,
		private readonly cuentaRepo: CuentaRepository,
		private readonly dosPasosRepo: DosPasosRepository,
		private readonly tokenService: TokenService,
	) {}

	/**
	 * Con la verificación en dos pasos activa no emite la sesión: devuelve un
	 * token intermedio para `CompletarLoginDosPasosUseCase`.
	 */
	async ejecutar(
		dto: LoginDto,
	): Promise<
		| { accessToken: string; refreshToken: string; usuario: UsuarioDto }
		| { requiereDosPasos: true; tokenDosPasos: string }
	> {
		const usuario = await this.usuarioRepository.buscarPorEmail(dto.email);

		// Bloqueada: ni se comprueba la contraseña, para no dar pistas durante el bloqueo.
		if (usuario && (await this.cuentaRepo.bloqueadoHasta(usuario.getId()))) {
			throw new BaseError(
				"Cuenta bloqueada temporalmente por demasiados intentos fallidos. Inténtalo más tarde o restablece tu contraseña.",
				429,
			);
		}

		const isPasswordValido = await this.passwordHasher.comparar(
			dto.password,
			usuario?.getPasswordHash() ?? HASH_PASSWORD_FICTICIO,
		);

		if (!usuario || !isPasswordValido) {
			if (usuario) {
				await this.cuentaRepo.registrarFallo(usuario.getId(), POLITICA_BLOQUEO);
			}
			throw new BaseError("Credenciales inválidas", 401);
		}

		if (!usuario.getIsActivo()) {
			throw new BaseError("El usuario está inactivo", 403);
		}

		// Los fallos no se reinician hasta acertar el código: si no, acertar la
		// contraseña de nuevo daría intentos ilimitados en el paso del código.
		if ((await this.dosPasosRepo.obtener(usuario.getId()))?.isActivo) {
			return {
				requiereDosPasos: true,
				tokenDosPasos: this.tokenService.generarTokenDosPasos(usuario.getId()),
			};
		}

		await this.cuentaRepo.reiniciarFallos(usuario.getId());

		return {
			...(await this.emisorSesion.emitir(usuario)),
			usuario: UsuarioMapper.toDto(usuario),
		};
	}
}
