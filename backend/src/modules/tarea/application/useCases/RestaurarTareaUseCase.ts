import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/** Saca una tarea de la papelera: quien podría eliminarla (su dueño o, compartida, quien puede crear ahí: RN-22). */
export class RestaurarTareaUseCase {
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
			true,
		);
		if (contexto && !contexto.puedeCrear) throw new SinPermisoTareasError();
		await this.tareaRepository.restaurar(id);
	}
}
