import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";
import type {
	ActualizarEquipoDto,
	AmbitoEquipo,
	EquipoDto,
} from "../dtos/EquipoDto";
import { EquipoMapper } from "../mappers/EquipoMapper";
import { buscarEquipo } from "./buscarEquipo";
import { validarReferencias } from "./validarReferencias";

/** Datos, miembros, líder y tags (`equipos:editar`). */
export class ActualizarEquipoUseCase {
	constructor(
		private readonly equipoRepository: EquipoRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoEquipo,
		id: number,
		dto: ActualizarEquipoDto,
	): Promise<EquipoDto> {
		await this.acceso.exigir(usuarioId, organizacionId, "equipos:editar");
		const equipo = await buscarEquipo(
			this.equipoRepository,
			organizacionId,
			id,
		);
		equipo.actualizar(dto);
		await validarReferencias(this.equipoRepository, organizacionId, dto);
		return EquipoMapper.toDto(await this.equipoRepository.actualizar(equipo));
	}
}
