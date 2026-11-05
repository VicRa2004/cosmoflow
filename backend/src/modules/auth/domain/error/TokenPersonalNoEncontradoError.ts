import { BaseError } from "@/core/shared/domain/error/BaseError";

export class TokenPersonalNoEncontradoError extends BaseError {
	constructor() {
		super("Token no encontrado", 404);
	}
}
