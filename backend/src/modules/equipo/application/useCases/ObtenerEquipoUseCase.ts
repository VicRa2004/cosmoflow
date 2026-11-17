import type { AccesoOrganizacion } from "@/modules/organizacion";
import { EquipoNoEncontradoError } from "../../domain/error/EquipoNoEncontradoError";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";
import type { AmbitoEquipo, EquipoDto } from "../dtos/EquipoDto";
import { EquipoMapper } from "../mappers/EquipoMapper";
import { buscarEquipo } from "./buscarEquipo";

export class ObtenerEquipoUseCase {
	constructor(
		private readonly equipoRepository: EquipoRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoEquipo,
		id: number,
	): Promise<EquipoDto> {
		const esAdmin = await this.acceso.esAdmin(usuarioId, organizacionId);
		const equipo = await buscarEquipo(
			this.equipoRepository,
			organizacionId,
			id,
		);
		// Fuera del equipo no existe (404), salvo para el admin.
		if (
			!esAdmin &&
			!equipo.getMiembros().some((m) => m.usuarioId === usuarioId)
		)
			throw new EquipoNoEncontradoError();
		return EquipoMapper.toDto(equipo);
	}
}
