import type { BajaEquipo } from "@/modules/equipo";
import { ProyectoSinEquiposError } from "../../domain/error/ProyectoSinEquiposError";
import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";

/** Bloquea eliminar el único equipo de un proyecto (RN-31). */
export class BajaEquipoProyectos implements BajaEquipo {
	constructor(private readonly proyectoRepository: ProyectoRepository) {}

	async comprobar(organizacionId: number, equipoId: number): Promise<void> {
		const proyectos = await this.proyectoRepository.proyectosSoloCon(
			organizacionId,
			equipoId,
		);
		if (proyectos.length > 0) throw new ProyectoSinEquiposError(proyectos);
	}
}
