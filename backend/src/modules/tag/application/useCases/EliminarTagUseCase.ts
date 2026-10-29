import { TagNoEncontradoError } from "../../domain/error/TagNoEncontradoError";
import type { TagRepository } from "../../domain/repository/TagRepository";

export class EliminarTagUseCase {
	constructor(private readonly tagRepository: TagRepository) {}

	async ejecutar(usuarioId: number, id: number): Promise<void> {
		if (!(await this.tagRepository.buscarPorId(usuarioId, id))) {
			throw new TagNoEncontradoError();
		}
		await this.tagRepository.eliminar(id);
	}
}
