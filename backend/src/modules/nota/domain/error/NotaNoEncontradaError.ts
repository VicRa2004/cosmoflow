import { BaseError } from "@/core/shared/domain/error/BaseError";

export class NotaNoEncontradaError extends BaseError {
	constructor() {
		super("Nota no encontrada", 404);
	}
}
