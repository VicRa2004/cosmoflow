import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { EstadoProyecto } from "../../domain/Proyecto";
import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";
import type { AmbitoProyecto, ProyectoDto } from "../dtos/ProyectoDto";
import { ProyectoMapper } from "../mappers/ProyectoMapper";

/** El admin ve todos los proyectos; los demás, solo donde están. Filtro opcional por estado. */
export class ObtenerProyectosUseCase {
	constructor(
		private readonly proyectoRepository: ProyectoRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoProyecto,
		filtro: { estado?: EstadoProyecto },
	): Promise<ProyectoDto[]> {
		const esAdmin = await this.acceso.esAdmin(usuarioId, organizacionId);
		const proyectos = await this.proyectoRepository.buscar(organizacionId, {
			...filtro,
			miembroId: esAdmin ? undefined : usuarioId,
		});
		return ProyectoMapper.conProgreso(this.proyectoRepository, proyectos);
	}
}
