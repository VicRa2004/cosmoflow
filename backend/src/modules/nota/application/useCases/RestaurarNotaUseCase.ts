import type { NotaRepository } from "../../domain/repository/NotaRepository";
import type { ProyectosNota } from "../services/ProyectosNota";

/** Saca una nota de la papelera: quien podría eliminarla (su dueño o, de proyecto, cualquier miembro). */
export class RestaurarNotaUseCase {
	constructor(
		private readonly notaRepository: NotaRepository,
		private readonly proyectos: ProyectosNota,
	) {}

	async ejecutar(usuarioId: number, id: number): Promise<void> {
		await this.proyectos.buscarVisible(usuarioId, id, true);
		await this.notaRepository.restaurar(id);
	}
}
