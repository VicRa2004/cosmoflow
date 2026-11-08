import { BaseError } from "@/core/shared/domain/error/BaseError";

/** Carpeta de otro ámbito, inexistente o que crearía un ciclo. */
export class CarpetaInvalidaError extends BaseError {
	constructor(mensaje = "La carpeta no existe") {
		super(mensaje, 400);
	}
}
