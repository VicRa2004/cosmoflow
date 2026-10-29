import { BaseError } from "@/core/shared/domain/error/BaseError";

export class InvitacionDeOtroEmailError extends BaseError {
	constructor() {
		super("Esta invitación es para otro email: entra con esa cuenta", 403);
	}
}
