import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import { TareaRestauradaEvent } from "../../domain/event/TareaRestauradaEvent";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/** Saca una tarea de la papelera: quien podría eliminarla (su dueño o, compartida, quien puede crear ahí: RN-22). */
export class RestaurarTareaUseCase {
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
			true,
		);
		if (contexto && !contexto.puedeCrear) throw new SinPermisoTareasError();
		await this.uow.ejecutar(async () => {
			await this.tareaRepository.restaurar(id);
			await this.eventBus.publish(new TareaRestauradaEvent({ tareaId: id }));
		});
	}
}
