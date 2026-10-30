import { BaseError } from "@/core/shared/domain/error/BaseError";

export class TelegramNoDisponibleError extends BaseError {
	constructor() {
		super("Telegram no está configurado en este servidor", 503);
	}
}
