import { BaseError } from "@/core/shared/domain/error/BaseError";

export class InvitacionNoVigenteError extends BaseError {
	constructor() {
		super("La invitación ya no es válida: pide que te la reenvíen", 410);
	}
}
