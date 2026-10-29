import { BaseError } from "@/core/shared/domain/error/BaseError";

/** El equipo o proyecto no existe o quien pide no es miembro (RN-90). */
export class ContextoNoEncontradoError extends BaseError {
	constructor() {
		super("Equipo o proyecto no encontrado", 404);
	}
}
