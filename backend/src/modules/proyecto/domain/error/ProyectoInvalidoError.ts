import { BaseError } from "@/core/shared/domain/error/BaseError";

/** Viola una regla del proyecto (RN-31, 32). */
export class ProyectoInvalidoError extends BaseError {
	constructor(mensaje: string) {
		super(mensaje, 400);
	}
}
