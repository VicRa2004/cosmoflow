import type {
	ContextoTareasEquipo,
	TareasEquipo,
} from "../../domain/TareasEquipo";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";

export class TareasEquipoService implements TareasEquipo {
	constructor(private readonly equipoRepository: EquipoRepository) {}

	async contexto(
		usuarioId: number,
		equipoId: number,
	): Promise<ContextoTareasEquipo | null> {
		const equipo = await this.equipoRepository.buscarSoloPorId(equipoId);
		const miembroIds = equipo?.getMiembros().map((m) => m.usuarioId) ?? [];
		if (!equipo || !miembroIds.includes(usuarioId)) return null;
		return {
			organizacionId: equipo.getOrganizacionId(),
			miembroIds,
			puedeCrear: equipo.puedeCrearTareas(usuarioId),
		};
	}
}
