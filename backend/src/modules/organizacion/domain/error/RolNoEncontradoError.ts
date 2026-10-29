import { BaseError } from "@/core/shared/domain/error/BaseError";

export class RolNoEncontradoError extends BaseError {
	constructor() {
		super("Rol no encontrado", 404);
	}
}
