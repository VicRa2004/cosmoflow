import type { NotaRepository } from "../../domain/repository/NotaRepository";
import type { ProyectosNota } from "../services/ProyectosNota";

/** Su dueño o, si es de proyecto, cualquier miembro. */
export class EliminarNotaUseCase {
	constructor(
		private readonly notaRepository: NotaRepository,
		private readonly proyectos: ProyectosNota,
	) {}

	async ejecutar(usuarioId: number, id: number): Promise<void> {
		await this.proyectos.buscarVisible(usuarioId, id);
		await this.notaRepository.eliminar(id);
	}
}
