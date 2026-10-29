import { BaseError } from "@/core/shared/domain/error/BaseError";

export class TareaNoEncontradaError extends BaseError {
	constructor() {
		super("Tarea no encontrada", 404);
	}
}
