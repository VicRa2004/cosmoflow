import { BaseError } from "@/core/shared/domain/error/BaseError";

export class ProyectoNoEncontradoError extends BaseError {
	constructor() {
		super("Proyecto no encontrado", 404);
	}
}
