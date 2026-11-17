import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";
import type { AmbitoEquipo, EquipoDto } from "../dtos/EquipoDto";
import { EquipoMapper } from "../mappers/EquipoMapper";

/** El admin ve todos los equipos; los demás, solo los suyos. Filtro opcional por tag (RN-24). */
export class ObtenerEquiposUseCase {
	constructor(
		private readonly equipoRepository: EquipoRepository,
		private readonly acceso: AccesoOrganizacion,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoEquipo,
		filtro: { tagId?: number },
	): Promise<EquipoDto[]> {
		const esAdmin = await this.acceso.esAdmin(usuarioId, organizacionId);
		const equipos = await this.equipoRepository.buscar(organizacionId, {
			...filtro,
			miembroId: esAdmin ? undefined : usuarioId,
		});
		return equipos.map(EquipoMapper.toDto);
	}
}
