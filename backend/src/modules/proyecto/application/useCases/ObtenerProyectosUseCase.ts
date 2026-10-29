import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { EstadoProyecto } from "../../domain/Proyecto";
import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";
import type { AmbitoProyecto, ProyectoDto } from "../dtos/ProyectoDto";
import { ProyectoMapper } from "../mappers/ProyectoMapper";

/** Cualquier miembro de la organización ve sus proyectos; filtro opcional por estado. */
export class ObtenerProyectosUseCase {
	constructor(
		private readonly proyectoRepository: ProyectoRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoProyecto,
		filtro: { estado?: EstadoProyecto },
	): Promise<ProyectoDto[]> {
		await this.acceso.exigir(usuarioId, organizacionId);
		const proyectos = await this.proyectoRepository.buscar(
			organizacionId,
			filtro,
		);
		return proyectos.map(ProyectoMapper.toDto);
	}
}
