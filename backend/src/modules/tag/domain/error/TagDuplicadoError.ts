import { BaseError } from "@/core/shared/domain/error/BaseError";

export class TagDuplicadoError extends BaseError {
	constructor() {
		super("Ya hay un tag con ese nombre", 409);
	}
}
