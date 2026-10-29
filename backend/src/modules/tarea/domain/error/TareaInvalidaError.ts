import { BaseError } from "@/core/shared/domain/error/BaseError";

export class TareaInvalidaError extends BaseError {
	constructor(mensaje: string) {
		super(mensaje, 400);
	}
}
