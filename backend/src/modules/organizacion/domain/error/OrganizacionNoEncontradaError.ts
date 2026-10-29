import { BaseError } from "@/core/shared/domain/error/BaseError";

export class OrganizacionNoEncontradaError extends BaseError {
	constructor() {
		super("Organización no encontrada", 404);
	}
}
