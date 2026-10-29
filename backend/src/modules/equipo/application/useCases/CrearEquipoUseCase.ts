import type { AccesoOrganizacion } from "@/modules/organizacion";
import { Equipo } from "../../domain/Equipo";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";
import type {
	AmbitoEquipo,
	CrearEquipoDto,
	EquipoDto,
} from "../dtos/EquipoDto";
import { EquipoMapper } from "../mappers/EquipoMapper";
import { validarReferencias } from "./validarReferencias";

export class CrearEquipoUseCase {
	constructor(
		private readonly equipoRepository: EquipoRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoEquipo,
		dto: CrearEquipoDto,
	): Promise<EquipoDto> {
		await this.acceso.exigir(usuarioId, organizacionId, "equipos:crear");
		const equipo = Equipo.crear(organizacionId, dto);
		await validarReferencias(this.equipoRepository, organizacionId, dto);
		return EquipoMapper.toDto(await this.equipoRepository.crear(equipo));
	}
}
