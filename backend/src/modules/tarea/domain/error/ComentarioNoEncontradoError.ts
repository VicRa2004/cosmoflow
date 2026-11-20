import { BaseError } from "@/core/shared/domain/error/BaseError";

export class ComentarioNoEncontradoError extends BaseError {
	constructor() {
		super("Comentario no encontrado", 404);
	}
}
