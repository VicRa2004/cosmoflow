import { BaseError } from "@/core/shared/domain/error/BaseError";

export class SoloAdminOrganizacionError extends BaseError {
	constructor() {
		super("Solo el administrador de la organización puede hacer esto", 403);
	}
}
