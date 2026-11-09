import { BaseError } from "@/core/shared/domain/error/BaseError";

export class EquipoNoEncontradoError extends BaseError {
	constructor(mensaje = "Equipo no encontrado") {
		super(mensaje, 404);
	}
}
