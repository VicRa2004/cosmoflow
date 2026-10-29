import { BaseError } from "@/core/shared/domain/error/BaseError";

/** RN-26: salir o ser expulsado de la organización dejaría un equipo con menos de 2. */
export class EquipoAlMinimoError extends BaseError {
	constructor(equipos: string[]) {
		super(
			`No puede salir: ${equipos.map((e) => `«${e}»`).join(", ")} se quedaría con menos de 2 miembros. Añade a otro miembro o elimina el equipo`,
			409,
		);
	}
}
