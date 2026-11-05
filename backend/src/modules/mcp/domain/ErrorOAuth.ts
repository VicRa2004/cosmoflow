import { BaseError } from "@/core/shared/domain/error/BaseError";

/** `codigo` es el campo `error` de RFC 6749: los clientes OAuth deciden por él. */
export class ErrorOAuth extends BaseError {
	constructor(
		readonly codigo:
			| "invalid_request"
			| "invalid_grant"
			| "invalid_redirect_uri"
			| "unsupported_grant_type",
		mensaje: string,
	) {
		super(mensaje, 400);
	}
}
