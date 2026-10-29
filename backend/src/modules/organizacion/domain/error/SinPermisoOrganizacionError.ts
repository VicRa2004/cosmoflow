import { BaseError } from "@/core/shared/domain/error/BaseError";

export class SinPermisoOrganizacionError extends BaseError {
	constructor() {
		super("No tienes permiso para hacer esto en la organización", 403);
	}
}
