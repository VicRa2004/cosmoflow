import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { NotaRepository } from "../../domain/repository/NotaRepository";
import type { NotaDto } from "../dtos/NotaDto";
import { NotaMapper } from "../mappers/NotaMapper";

/** Días que una nota pasa en la papelera antes de borrarse del todo. */
export const DIAS_PAPELERA_NOTAS = 30;

/** Las borradas que el usuario aún vería (personales y de sus proyectos). */
export class ObtenerPapeleraNotasUseCase {
	constructor(private readonly notaRepository: NotaRepository) {}

	async ejecutar(
		usuarioId: number,
		paginacion: { pagina: number; limite: number },
	): Promise<Paginacion<NotaDto>> {
		const resultado = await this.notaRepository.buscarPapelera(
			usuarioId,
			paginacion,
		);
		return { ...resultado, datos: resultado.datos.map(NotaMapper.toDto) };
	}
}
