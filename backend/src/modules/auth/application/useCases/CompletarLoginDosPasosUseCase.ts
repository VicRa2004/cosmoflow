import { BaseError } from "@/core/shared/domain/error/BaseError";
import {
	type UsuarioDto,
	UsuarioMapper,
	type UsuarioRepository,
} from "@/core/usuario";
import type { CuentaRepository } from "../../domain/repository/CuentaRepository";
import type { TokenService } from "../../domain/service/TokenService";
import type { EmisorSesion } from "../services/EmisorSesion";
import type { VerificadorDosPasos } from "../services/VerificadorDosPasos";
import { POLITICA_BLOQUEO } from "./LoginUseCase";

/**
 * Segundo paso del login: canjea el token intermedio y un código (TOTP o de
 * recuperación) por la sesión. Los fallos cuentan para el mismo bloqueo de
 * cuenta que la contraseña.
 */
export class CompletarLoginDosPasosUseCase {
	constructor(
		private readonly tokenService: TokenService,
		private readonly usuarioRepository: UsuarioRepository,
		private readonly verificador: VerificadorDosPasos,
		private readonly cuentaRepo: CuentaRepository,
		private readonly emisorSesion: EmisorSesion,
	) {}

	async ejecutar(dto: { tokenDosPasos: string; codigo: string }): Promise<{
		accessToken: string;
		refreshToken: string;
		usuario: UsuarioDto;
	}> {
		let usuarioId: number;
		try {
			usuarioId = this.tokenService.verificarTokenDosPasos(dto.tokenDosPasos);
		} catch {
			throw new BaseError(
				"El inicio de sesión caducó. Vuelve a introducir tu contraseña.",
				401,
			);
		}

		const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!usuario?.getIsActivo()) {
			throw new BaseError("Credenciales inválidas", 401);
		}

		if (await this.cuentaRepo.bloqueadoHasta(usuarioId)) {
			throw new BaseError(
				"Cuenta bloqueada temporalmente por demasiados intentos fallidos. Inténtalo más tarde.",
				429,
			);
		}

		if (!(await this.verificador.verificar(usuarioId, dto.codigo))) {
			await this.cuentaRepo.registrarFallo(usuarioId, POLITICA_BLOQUEO);
			throw new BaseError("Código incorrecto", 401);
		}

		await this.cuentaRepo.reiniciarFallos(usuarioId);
		return {
			...(await this.emisorSesion.emitir(usuario)),
			usuario: UsuarioMapper.toDto(usuario),
		};
	}
}
