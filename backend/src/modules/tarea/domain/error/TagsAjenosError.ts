import { BaseError } from "@/core/shared/domain/error/BaseError";

export class TagsAjenosError extends BaseError {
	constructor() {
		super("Alguno de los tags no existe", 400);
	}
}
