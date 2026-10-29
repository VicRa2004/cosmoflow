import { TareaNoEncontradaError } from "../../domain/error/TareaNoEncontradaError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";

export class ObtenerTareaUseCase {
	constructor(private readonly tareaRepository: TareaRepository) {}

	async ejecutar(usuarioId: number, id: number): Promise<TareaDto> {
		const tarea = await this.tareaRepository.buscarPorId(usuarioId, id);
		if (!tarea) {
			throw new TareaNoEncontradaError();
		}
		return TareaMapper.toDto(tarea);
	}
}
