import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";

/** Días que una tarea pasa en la papelera antes de borrarse del todo. */
export const DIAS_PAPELERA_TAREAS = 30;

/** Las borradas que el usuario aún vería (personales y de sus contextos). */
export class ObtenerPapeleraTareasUseCase {
	constructor(private readonly tareaRepository: TareaRepository) {}

	async ejecutar(
		usuarioId: number,
		paginacion: { pagina: number; limite: number },
	): Promise<Paginacion<TareaDto>> {
		const resultado = await this.tareaRepository.buscarPapelera(
			usuarioId,
			paginacion,
		);
		return { ...resultado, datos: resultado.datos.map(TareaMapper.toDto) };
	}
}
