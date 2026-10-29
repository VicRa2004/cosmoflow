import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";
import type { AmbitoEquipo, EquipoDto } from "../dtos/EquipoDto";
import { EquipoMapper } from "../mappers/EquipoMapper";

/** Cualquier miembro ve los equipos de su organización; filtro opcional por tag (RN-24). */
export class ObtenerEquiposUseCase {
	constructor(
		private readonly equipoRepository: EquipoRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoEquipo,
		filtro: { tagId?: number },
	): Promise<EquipoDto[]> {
		await this.acceso.exigir(usuarioId, organizacionId);
		const equipos = await this.equipoRepository.buscar(organizacionId, filtro);
		return equipos.map(EquipoMapper.toDto);
	}
}
