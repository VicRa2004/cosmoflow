import { BaseError } from "@/core/shared/domain/error/BaseError";

export class RolDuplicadoError extends BaseError {
	constructor() {
		super("Ya hay un rol con ese nombre en la organización", 409);
	}
}
