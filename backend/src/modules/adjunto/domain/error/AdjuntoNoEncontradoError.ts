import { BaseError } from "@/core/shared/domain/error/BaseError";

export class AdjuntoNoEncontradoError extends BaseError {
	constructor() {
		super("Adjunto no encontrado", 404);
	}
}
