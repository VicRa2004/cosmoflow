import type { AccesoOrganizacion } from "@/modules/organizacion";
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
		await this.acceso.exigir(usuarioId, organizacionId);
		return EquipoMapper.toDto(
			await buscarEquipo(this.equipoRepository, organizacionId, id),
		);
	}
}
