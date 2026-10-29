import { BaseError } from "@/core/shared/domain/error/BaseError";

/** El equipo o proyecto no existe o quien sube no es miembro (RN-90). */
export class AmbitoNoEncontradoError extends BaseError {
	constructor() {
		super("Equipo o proyecto no encontrado", 404);
	}
}
