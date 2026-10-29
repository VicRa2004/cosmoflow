import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";
import type { AmbitoProyecto } from "../dtos/ProyectoDto";
import { buscarProyecto } from "./buscarProyecto";

export class EliminarProyectoUseCase {
	constructor(
		private readonly proyectoRepository: ProyectoRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoProyecto,
		id: number,
	): Promise<void> {
		await this.acceso.exigir(usuarioId, organizacionId, "proyectos:eliminar");
		await buscarProyecto(this.proyectoRepository, organizacionId, id);
		await this.proyectoRepository.eliminar(organizacionId, id);
	}
}
