import { OrganizacionNoEncontradaError } from "../../domain/error/OrganizacionNoEncontradaError";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { MiembroDto } from "../dtos/MiembroDto";
import { MiembroMapper } from "../mappers/MiembroMapper";

/** Cualquier miembro ve a los demás; quien no lo es, ni la organización (404). */
export class ObtenerMiembrosUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
	): Promise<MiembroDto[]> {
		if (
			!(await this.organizacionRepository.buscarPorId(
				usuarioId,
				organizacionId,
			))
		) {
			throw new OrganizacionNoEncontradaError();
		}
		const miembros =
			await this.organizacionRepository.buscarMiembros(organizacionId);
		return miembros.map(MiembroMapper.toDto);
	}
}
