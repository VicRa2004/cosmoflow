import { BaseError } from "@/core/shared/domain/error/BaseError";

export class AdminNoExpulsableError extends BaseError {
	constructor() {
		super("No se puede expulsar al administrador de la organización", 403);
	}
}
