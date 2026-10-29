import { BaseError } from "@/core/shared/domain/error/BaseError";

export class TagNoEncontradoError extends BaseError {
	constructor() {
		super("Tag no encontrado", 404);
	}
}
