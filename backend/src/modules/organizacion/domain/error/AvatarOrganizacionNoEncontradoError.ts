import { BaseError } from "@/core/shared/domain/error/BaseError";

export class AvatarOrganizacionNoEncontradoError extends BaseError {
	constructor() {
		super("La organización no tiene avatar", 404);
	}
}
