import { BaseError } from "@/core/shared/domain/error/BaseError";

export class TagDuplicadoError extends BaseError {
	constructor() {
		super("Ya tienes un tag con ese nombre", 409);
	}
}
