import { BaseError } from "@/core/shared/domain/error/BaseError";
import type { EventBus } from "@/core/shared/domain/events/EventBus";
import { DosPasosActivadoEvent } from "../../domain/event/DosPasosEvent";
import type { DosPasosRepository } from "../../domain/repository/DosPasosRepository";
import {
	generarCodigosRecuperacion,
	hashearCodigoRecuperacion,
	verificarTotp,
} from "../../domain/totp";

/**
 * Confirma el primer código de la app y activa la verificación.
 * @returns los códigos de recuperación en claro: es la única vez que se ven.
 */
export class ActivarDosPasosUseCase {
	constructor(
		private readonly dosPasosRepo: DosPasosRepository,
		private readonly eventBus: EventBus,
	) {}

	async ejecutar(usuarioId: number, codigo: string): Promise<string[]> {
		const dosPasos = await this.dosPasosRepo.obtener(usuarioId);
		if (!dosPasos) {
			throw new BaseError("Primero genera el código QR", 400);
		}
		if (dosPasos.isActivo) {
			throw new BaseError("La verificación en dos pasos ya está activada", 400);
		}

		const paso = verificarTotp(dosPasos.secreto, codigo.trim(), Date.now());
		if (paso === null) {
			throw new BaseError(
				"Código incorrecto. Comprueba la hora del dispositivo.",
				400,
			);
		}

		const codigos = generarCodigosRecuperacion();
		await this.dosPasosRepo.activar(
			usuarioId,
			paso,
			codigos.map(hashearCodigoRecuperacion),
		);
		await this.eventBus.publish(new DosPasosActivadoEvent({ usuarioId }));
		return codigos;
	}
}
