import { BaseError } from "@/core/shared/domain/error/BaseError";

export class InvitacionNoEncontradaError extends BaseError {
	constructor() {
		super("Invitación no encontrada", 404);
	}
}
