import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/** Personal: su dueño. Compartida: quien puede crear tareas ahí (RN-22). */
export class EliminarTareaUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
	) {}

	async ejecutar(usuarioId: number, id: number): Promise<void> {
		const { contexto } = await buscarTareaVisible(
			this.tareaRepository,
			this.contextos,
			usuarioId,
			id,
		);
		if (contexto && !contexto.puedeCrear) throw new SinPermisoTareasError();
		await this.tareaRepository.eliminar(id);
	}
}
