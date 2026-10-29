import { BaseError } from "@/core/shared/domain/error/BaseError";

/** Viola una regla del equipo (RN-20, 21, 22, 24). */
export class EquipoInvalidoError extends BaseError {
	constructor(mensaje: string) {
		super(mensaje, 400);
	}
}
