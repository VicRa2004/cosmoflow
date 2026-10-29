import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";
import type { AmbitoProyecto, ProyectoDto } from "../dtos/ProyectoDto";
import { ProyectoMapper } from "../mappers/ProyectoMapper";
import { buscarProyecto } from "./buscarProyecto";

export class ObtenerProyectoUseCase {
	constructor(
		private readonly proyectoRepository: ProyectoRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoProyecto,
		id: number,
	): Promise<ProyectoDto> {
		await this.acceso.exigir(usuarioId, organizacionId);
		return ProyectoMapper.toDto(
			await buscarProyecto(this.proyectoRepository, organizacionId, id),
		);
	}
}
