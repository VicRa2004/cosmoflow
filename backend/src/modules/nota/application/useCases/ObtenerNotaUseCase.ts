import { NotaNoEncontradaError } from "../../domain/error/NotaNoEncontradaError";
import type { NotaRepository } from "../../domain/repository/NotaRepository";
import type { NotaDto } from "../dtos/NotaDto";
import { NotaMapper } from "../mappers/NotaMapper";

export class ObtenerNotaUseCase {
	constructor(private readonly notaRepository: NotaRepository) {}

	async ejecutar(usuarioId: number, id: number): Promise<NotaDto> {
		const nota = await this.notaRepository.buscarPorId(usuarioId, id);
		if (!nota) {
			throw new NotaNoEncontradaError();
		}
		return NotaMapper.toDto(nota);
	}
}
