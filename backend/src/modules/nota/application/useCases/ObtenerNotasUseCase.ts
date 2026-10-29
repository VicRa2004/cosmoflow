import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { NotaRepository } from "../../domain/repository/NotaRepository";
import type { NotaDto } from "../dtos/NotaDto";
import type { ObtenerNotasDto } from "../dtos/ObtenerNotasDto";
import { NotaMapper } from "../mappers/NotaMapper";
import type { ProyectosNota } from "../services/ProyectosNota";

/** Las personales, o las de un proyecto del que se es miembro. */
export class ObtenerNotasUseCase {
	constructor(
		private readonly notaRepository: NotaRepository,
		private readonly proyectos: ProyectosNota,
	) {}

	async ejecutar(
		usuarioId: number,
		{ proyectoId, ...filtros }: ObtenerNotasDto,
	): Promise<Paginacion<NotaDto>> {
		if (proyectoId) await this.proyectos.exigir(usuarioId, proyectoId);
		const resultado = await this.notaRepository.buscar(
			proyectoId ? { proyectoId } : { usuarioId },
			filtros,
		);
		return { ...resultado, datos: resultado.datos.map(NotaMapper.toDto) };
	}
}
