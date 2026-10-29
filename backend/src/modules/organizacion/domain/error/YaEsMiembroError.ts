import { BaseError } from "@/core/shared/domain/error/BaseError";

export class YaEsMiembroError extends BaseError {
	constructor() {
		super("Esa persona ya es miembro de la organización", 409);
	}
}
