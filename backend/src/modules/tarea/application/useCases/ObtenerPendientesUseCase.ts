import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";

/** Vista de pendientes (RN-43). */
export class ObtenerPendientesUseCase {
	constructor(private readonly tareaRepository: TareaRepository) {}

	async ejecutar(
		usuarioId: number,
		paginacion: { pagina: number; limite: number },
	): Promise<Paginacion<TareaDto>> {
		const resultado = await this.tareaRepository.buscarPendientes(
			usuarioId,
			paginacion,
		);
		return { ...resultado, datos: resultado.datos.map(TareaMapper.toDto) };
	}
}
