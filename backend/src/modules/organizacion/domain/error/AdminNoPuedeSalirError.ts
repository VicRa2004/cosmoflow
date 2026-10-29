import { BaseError } from "@/core/shared/domain/error/BaseError";

export class AdminNoPuedeSalirError extends BaseError {
	constructor() {
		super(
			"Delega la administración antes de salir, o elimina la organización",
			409,
		);
	}
}
