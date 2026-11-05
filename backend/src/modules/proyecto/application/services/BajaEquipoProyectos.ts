import type { BajaEquipo } from "@/modules/equipo";
import { ProyectoSinIntegrantesError } from "../../domain/error/ProyectoSinIntegrantesError";
import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";

/** Bloquea eliminar el equipo que es el único integrante de un proyecto (RN-31). */
export class BajaEquipoProyectos implements BajaEquipo {
	constructor(private readonly proyectoRepository: ProyectoRepository) {}

	async comprobar(organizacionId: number, equipoId: number): Promise<void> {
		const proyectos = await this.proyectoRepository.proyectosSoloCon(
			organizacionId,
			equipoId,
		);
		if (proyectos.length > 0) throw new ProyectoSinIntegrantesError(proyectos);
	}
}
