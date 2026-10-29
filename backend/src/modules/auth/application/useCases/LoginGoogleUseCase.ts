import { randomBytes } from "node:crypto";
import { BaseError } from "@/core/shared/domain/error/BaseError";
import {
	type PasswordHasher,
	Usuario,
	type UsuarioRepository,
} from "@/core/usuario";
import type { CuentaRepository } from "../../domain/repository/CuentaRepository";
import type { RefreshTokenRepository } from "../../domain/repository/RefreshTokenRepository";
import type {
	PerfilGoogle,
	ProveedorGoogle,
} from "../../domain/service/ProveedorGoogle";
import type { EmisorSesion } from "../services/EmisorSesion";

/**
 * Login (o alta) con Google. Busca por la cuenta de Google y, si no está
 * vinculada, por el email: así un usuario con contraseña puede entrar también
 * con Google.
 */
export class LoginGoogleUseCase {
	constructor(
		private readonly google: ProveedorGoogle,
		private readonly usuarioRepository: UsuarioRepository,
		private readonly passwordHasher: PasswordHasher,
		private readonly cuentaRepo: CuentaRepository,
		private readonly refreshTokenRepo: RefreshTokenRepository,
		private readonly emisorSesion: EmisorSesion,
	) {}

	async ejecutar(dto: {
		code: string;
		codeVerifier: string;
	}): Promise<{ accessToken: string; refreshToken: string }> {
		const perfil = await this.google.obtenerPerfil(dto.code, dto.codeVerifier);
		const usuario = await this.resolverUsuario(perfil);

		if (!usuario.getIsActivo()) {
			throw new BaseError("El usuario está inactivo", 403);
		}
		return this.emisorSesion.emitir(usuario);
	}

	private async resolverUsuario(perfil: PerfilGoogle): Promise<Usuario> {
		const vinculadoId = await this.cuentaRepo.buscarUsuarioIdPorGoogleId(
			perfil.googleId,
		);
		const vinculado =
			vinculadoId && (await this.usuarioRepository.buscarPorId(vinculadoId));
		if (vinculado) return vinculado;

		const existente = await this.usuarioRepository.buscarPorEmail(perfil.email);
		if (existente) {
			// Email sin verificar: la cuenta pudo crearla otra persona con este email
			// antes que su dueño (pre-secuestro). Se anulan su contraseña y sus sesiones.
			if (!existente.getEmailVerificado()) {
				existente.actualizar({ passwordHash: await this.passwordInutil() });
				await this.usuarioRepository.actualizar(existente);
				await this.refreshTokenRepo.revocarTodosPorUsuarioId(existente.getId());
			}
			await this.cuentaRepo.vincularGoogle(existente.getId(), perfil.googleId);
			return existente;
		}

		// Sin contraseña conocida: si quiere una, la crea con «¿Olvidaste tu contraseña?».
		const nuevo = await this.usuarioRepository.crear(
			Usuario.crear(perfil.nombre, perfil.email, await this.passwordInutil()),
		);
		await this.cuentaRepo.vincularGoogle(nuevo.getId(), perfil.googleId);
		return nuevo;
	}

	private passwordInutil(): Promise<string> {
		return this.passwordHasher.hash(randomBytes(32).toString("hex"));
	}
}
