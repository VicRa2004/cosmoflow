import { BaseError } from "@/core/shared/domain/error/BaseError";

export class SesionNoEncontradaError extends BaseError {
	constructor() {
		super("Sesión no encontrada", 404);
	}
}
