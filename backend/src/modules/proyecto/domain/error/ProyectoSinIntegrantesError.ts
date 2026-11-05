import { BaseError } from "@/core/shared/domain/error/BaseError";

/** RN-31: eliminar el equipo dejaría proyectos sin integrantes. */
export class ProyectoSinIntegrantesError extends BaseError {
	constructor(proyectos: string[]) {
		super(
			`No se puede eliminar: ${proyectos.map((p) => `«${p}»`).join(", ")} se quedaría sin integrantes. Asígnale otro equipo o una persona antes`,
			409,
		);
	}
}
