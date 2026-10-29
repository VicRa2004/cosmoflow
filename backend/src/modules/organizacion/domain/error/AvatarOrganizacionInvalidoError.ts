import { BaseError } from "@/core/shared/domain/error/BaseError";

export class AvatarOrganizacionInvalidoError extends BaseError {
	constructor(mensaje: string) {
		super(mensaje, 400);
	}
}
