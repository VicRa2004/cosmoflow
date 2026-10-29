import type { AccesoOrganizacion } from "@/modules/organizacion";
import { SinPermisoDelegadosError } from "../../domain/error/SinPermisoDelegadosError";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";
import type { AmbitoEquipo, EquipoDto } from "../dtos/EquipoDto";
import { EquipoMapper } from "../mappers/EquipoMapper";
import { buscarEquipo } from "./buscarEquipo";

/** El líder (o quien tenga `equipos:editar`) elige a sus delegados (RN-22). */
export class CambiarDelegadosUseCase {
	constructor(
		private readonly equipoRepository: EquipoRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoEquipo,
		id: number,
		usuarioIds: number[],
	): Promise<EquipoDto> {
		const permisos = await this.acceso.exigir(usuarioId, organizacionId);
		const equipo = await buscarEquipo(
			this.equipoRepository,
			organizacionId,
			id,
		);
		if (
			equipo.getLiderId() !== usuarioId &&
			!permisos.includes("equipos:editar")
		) {
			throw new SinPermisoDelegadosError();
		}
		equipo.cambiarDelegados(usuarioIds);
		return EquipoMapper.toDto(await this.equipoRepository.actualizar(equipo));
	}
}
