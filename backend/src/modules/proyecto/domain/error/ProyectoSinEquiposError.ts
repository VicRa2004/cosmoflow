import { BaseError } from "@/core/shared/domain/error/BaseError";

/** RN-31: eliminar el equipo dejaría proyectos sin ninguno. */
export class ProyectoSinEquiposError extends BaseError {
	constructor(proyectos: string[]) {
		super(
			`No se puede eliminar: ${proyectos.map((p) => `«${p}»`).join(", ")} se quedaría sin equipos. Asígnale otro equipo antes`,
			409,
		);
	}
}
