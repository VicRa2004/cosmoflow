import { BaseError } from "@/core/shared/domain/error/BaseError";
import {
	UsuarioNoEncontradoError,
	type UsuarioRepository,
} from "@/core/usuario";
import type { DosPasosRepository } from "../../domain/repository/DosPasosRepository";
import { generarSecretoTotp, uriOtpauth } from "../../domain/totp";

/** Primer paso de la activación: genera el secreto (sin activar) para el QR. */
export class IniciarDosPasosUseCase {
	constructor(
		private readonly usuarioRepository: UsuarioRepository,
		private readonly dosPasosRepo: DosPasosRepository,
	) {}

	async ejecutar(usuarioId: number): Promise<{ secreto: string; uri: string }> {
		const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
		if (!usuario) throw new UsuarioNoEncontradoError();
		if ((await this.dosPasosRepo.obtener(usuarioId))?.isActivo) {
			throw new BaseError("La verificación en dos pasos ya está activada", 400);
		}

		const secreto = generarSecretoTotp();
		await this.dosPasosRepo.guardarPendiente(usuarioId, secreto);
		return {
			secreto,
			uri: uriOtpauth("Cosmoflow", usuario.getEmail(), secreto),
		};
	}
}
