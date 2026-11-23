import { BaseError } from "@/core/shared/domain/error/BaseError";

export class SuscripcionCalendarioNoEncontradaError extends BaseError {
	constructor() {
		super("Calendario no encontrado", 404);
	}
}
