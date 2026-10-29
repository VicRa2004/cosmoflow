import type { AccesoOrganizacion } from "@/modules/organizacion";
import { Proyecto } from "../../domain/Proyecto";
import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";
import type {
	AmbitoProyecto,
	CrearProyectoDto,
	ProyectoDto,
} from "../dtos/ProyectoDto";
import { ProyectoMapper } from "../mappers/ProyectoMapper";
import { validarReferencias } from "./validarReferencias";

export class CrearProyectoUseCase {
	constructor(
		private readonly proyectoRepository: ProyectoRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoProyecto,
		dto: CrearProyectoDto,
	): Promise<ProyectoDto> {
		await this.acceso.exigir(usuarioId, organizacionId, "proyectos:crear");
		const proyecto = Proyecto.crear(organizacionId, dto);
		await validarReferencias(this.proyectoRepository, organizacionId, dto);
		return ProyectoMapper.toDto(await this.proyectoRepository.crear(proyecto));
	}
}
