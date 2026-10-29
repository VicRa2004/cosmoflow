import { BaseError } from "@/core/shared/domain/error/BaseError";

/** El proyecto no existe o quien pide no es miembro (RN-90). */
export class ProyectoNoEncontradoError extends BaseError {
	constructor() {
		super("Proyecto no encontrado", 404);
	}
}
