import { BaseError } from "@/core/shared/domain/error/BaseError";

export class EquipoNoEncontradoError extends BaseError {
	constructor() {
		super("Equipo no encontrado", 404);
	}
}
