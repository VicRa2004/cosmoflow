import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import { TareaEliminadaEvent } from "../../domain/event/TareaEliminadaEvent";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/** Personal: su dueño. Compartida: quien puede crear tareas ahí (RN-22). */
export class EliminarTareaUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(usuarioId: number, id: number): Promise<void> {
		const { contexto } = await buscarTareaVisible(
			this.tareaRepository,
			this.contextos,
			usuarioId,
			id,
		);
		if (contexto && !contexto.puedeCrear) throw new SinPermisoTareasError();
		await this.uow.ejecutar(async () => {
			await this.tareaRepository.eliminar(id);
			await this.eventBus.publish(new TareaEliminadaEvent({ tareaId: id }));
		});
	}
}
