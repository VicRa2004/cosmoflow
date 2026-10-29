import { BaseError } from "@/core/shared/domain/error/BaseError";

export class InvitacionDuplicadaError extends BaseError {
	constructor() {
		super("Ya hay una invitación pendiente para ese email: reenvíala", 409);
	}
}
