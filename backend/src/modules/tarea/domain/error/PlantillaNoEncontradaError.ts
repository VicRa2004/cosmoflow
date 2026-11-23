import { BaseError } from "@/core/shared/domain/error/BaseError";

export class PlantillaNoEncontradaError extends BaseError {
	constructor() {
		super("Plantilla no encontrada", 404);
	}
}
