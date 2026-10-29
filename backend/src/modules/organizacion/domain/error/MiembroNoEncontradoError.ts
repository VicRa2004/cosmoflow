import { BaseError } from "@/core/shared/domain/error/BaseError";

export class MiembroNoEncontradoError extends BaseError {
	constructor() {
		super("Esa persona no es miembro de la organización", 404);
	}
}
