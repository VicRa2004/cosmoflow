import { BaseError } from "@/core/shared/domain/error/BaseError";

export class CarpetaNoEncontradaError extends BaseError {
	constructor() {
		super("Carpeta no encontrada", 404);
	}
}
