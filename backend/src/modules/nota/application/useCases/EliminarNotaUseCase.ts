import { NotaNoEncontradaError } from "../../domain/error/NotaNoEncontradaError";
import type { NotaRepository } from "../../domain/repository/NotaRepository";

export class EliminarNotaUseCase {
	constructor(private readonly notaRepository: NotaRepository) {}

	async ejecutar(usuarioId: number, id: number): Promise<void> {
		if (!(await this.notaRepository.buscarPorId(usuarioId, id))) {
			throw new NotaNoEncontradaError();
		}
		await this.notaRepository.eliminar(id);
	}
}
