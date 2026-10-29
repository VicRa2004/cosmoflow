import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";
import type {
	ContextoTareasProyecto,
	TareasProyecto,
} from "../../domain/TareasProyecto";

export class TareasProyectoService implements TareasProyecto {
	constructor(private readonly proyectoRepository: ProyectoRepository) {}

	async contexto(
		usuarioId: number,
		proyectoId: number,
	): Promise<ContextoTareasProyecto | null> {
		const proyecto = await this.proyectoRepository.buscarSoloPorId(proyectoId);
		if (!proyecto) return null;
		const miembroIds = await this.proyectoRepository.miembrosDe(proyecto);
		if (!miembroIds.includes(usuarioId)) return null;
		return {
			organizacionId: proyecto.getOrganizacionId(),
			miembroIds,
			puedeCrear: true,
		};
	}
}
