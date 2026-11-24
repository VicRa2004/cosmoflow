import type { DosPasosRepository } from "../../domain/repository/DosPasosRepository";
import { hashearCodigoRecuperacion, verificarTotp } from "../../domain/totp";

/**
 * Comprueba un código de la app autenticadora (6 dígitos, cada uno vale una
 * sola vez) o un código de recuperación (de un solo uso).
 */
export class VerificadorDosPasos {
	constructor(private readonly dosPasosRepo: DosPasosRepository) {}

	async verificar(usuarioId: number, codigo: string): Promise<boolean> {
		const dosPasos = await this.dosPasosRepo.obtener(usuarioId);
		if (!dosPasos?.isActivo) return false;

		const limpio = codigo.trim();
		if (/^\d{6}$/.test(limpio)) {
			const paso = verificarTotp(dosPasos.secreto, limpio, Date.now());
			return paso !== null && this.dosPasosRepo.marcarPaso(usuarioId, paso);
		}
		return this.dosPasosRepo.consumirCodigoRecuperacion(
			usuarioId,
			hashearCodigoRecuperacion(limpio),
		);
	}
}
