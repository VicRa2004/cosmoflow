import { TareaNoEncontradaError } from "../../domain/error/TareaNoEncontradaError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";

export class EliminarTareaUseCase {
	constructor(private readonly tareaRepository: TareaRepository) {}

	async ejecutar(usuarioId: number, id: number): Promise<void> {
		if (!(await this.tareaRepository.buscarPorId(usuarioId, id))) {
			throw new TareaNoEncontradaError();
		}
		await this.tareaRepository.eliminar(id);
	}
}
