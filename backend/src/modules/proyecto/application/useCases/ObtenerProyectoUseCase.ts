import type { AccesoOrganizacion } from "@/modules/organizacion";
import { ProyectoNoEncontradoError } from "../../domain/error/ProyectoNoEncontradoError";
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
		const esAdmin = await this.acceso.esAdmin(usuarioId, organizacionId);
		const proyecto = await buscarProyecto(
			this.proyectoRepository,
			organizacionId,
			id,
		);
		// Fuera del proyecto no existe (404), salvo para el admin.
		if (
			!esAdmin &&
			!(await this.proyectoRepository.miembrosDe(proyecto)).includes(usuarioId)
		)
			throw new ProyectoNoEncontradoError();
		const progreso = await this.proyectoRepository.progreso([id]);
		return ProyectoMapper.toDto(proyecto, progreso.get(id));
	}
}
