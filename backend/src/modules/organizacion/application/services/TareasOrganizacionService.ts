import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type {
	ContextoTareasOrganizacion,
	TareasOrganizacion,
} from "../../domain/TareasOrganizacion";

export class TareasOrganizacionService implements TareasOrganizacion {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
	) {}

	async contexto(
		usuarioId: number,
		organizacionId: number,
	): Promise<ContextoTareasOrganizacion | null> {
		const miembro = await this.organizacionRepository.buscarPorId(
			usuarioId,
			organizacionId,
		);
		if (!miembro) return null;
		const miembros =
			await this.organizacionRepository.buscarMiembros(organizacionId);
		return {
			organizacionId,
			miembroIds: miembros.map((m) => m.usuarioId),
			// Como en los proyectos: cualquier miembro crea (para orgs sin equipos).
			puedeCrear: true,
		};
	}
}
