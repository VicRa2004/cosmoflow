import type { SalidaMiembro } from "@/modules/organizacion";
import { EquipoAlMinimoError } from "../../domain/error/EquipoAlMinimoError";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";

/**
 * Bloquea salir de la organización si un equipo bajaría de 2 (RN-26). Si puede salir,
 * la FK de `miembro_equipo` lo quita de sus equipos.
 */
export class SalidaMiembroEquipos implements SalidaMiembro {
	constructor(private readonly equipoRepository: EquipoRepository) {}

	async comprobar(organizacionId: number, usuarioId: number): Promise<void> {
		const equipos = await this.equipoRepository.equiposAlMinimo(
			organizacionId,
			usuarioId,
		);
		if (equipos.length > 0) throw new EquipoAlMinimoError(equipos);
	}
}
