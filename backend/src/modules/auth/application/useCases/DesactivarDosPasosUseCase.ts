import { BaseError } from "@/core/shared/domain/error/BaseError";
import type { EventBus } from "@/core/shared/domain/events/EventBus";
import {
	type PasswordHasher,
	UsuarioNoEncontradoError,
	type UsuarioRepository,
} from "@/core/usuario";
import { DosPasosDesactivadoEvent } from "../../domain/event/DosPasosEvent";
import type { DosPasosRepository } from "../../domain/repository/DosPasosRepository";
import type { VerificadorDosPasos } from "../services/VerificadorDosPasos";

/**
 * Desactiva la verificación pidiendo la contraseña o un código (de la app o de
 * recuperación): las cuentas de Google no conocen su contraseña.
 */
export class DesactivarDosPasosUseCase {
	constructor(
		private readonly usuarioRepository: UsuarioRepository,
		private readonly passwordHasher: PasswordHasher,
		private readonly dosPasosRepo: DosPasosRepository,
		private readonly verificador: VerificadorDosPasos,
		private readonly eventBus: EventBus,
	) {}

	async ejecutar(
		usuarioId: number,
		dto: { password?: string; codigo?: string },
	): Promise<void> {
		const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!usuario) throw new UsuarioNoEncontradoError();
		if (!(await this.dosPasosRepo.obtener(usuarioId))?.isActivo) {
			throw new BaseError("La verificación en dos pasos no está activada", 400);
		}

		const isValido = dto.password
			? await this.passwordHasher.comparar(
					dto.password,
					usuario.getPasswordHash(),
				)
			: await this.verificador.verificar(usuarioId, dto.codigo ?? "");
		if (!isValido) {
			throw new BaseError(
				dto.password ? "La contraseña no es correcta" : "Código incorrecto",
				400,
			);
		}

		await this.dosPasosRepo.eliminar(usuarioId);
		await this.eventBus.publish(
			new DosPasosDesactivadoEvent({
				usuarioId,
				metodo: dto.password ? "password" : "codigo",
			}),
		);
	}
}
