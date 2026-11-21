import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import { TareaEliminadaEvent } from "../../domain/event/TareaEliminadaEvent";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ResultadoLoteTareasDto } from "../dtos/AccionLoteTareasDto";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/** Mueve a la papelera un conjunto de tareas respetando visibilidad y RN-22. */
export class EliminarLoteTareasUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		usuarioId: number,
		rawIds: number[],
	): Promise<ResultadoLoteTareasDto> {
		const ids = [...new Set(rawIds)];
		for (const id of ids) {
			const { contexto } = await buscarTareaVisible(
				this.tareaRepository,
				this.contextos,
				usuarioId,
				id,
			);
			if (contexto && !contexto.puedeCrear) {
				throw new SinPermisoTareasError();
			}
		}

		await this.uow.ejecutar(async () => {
			for (const id of ids) {
				await this.tareaRepository.eliminar(id);
				await this.eventBus.publish(new TareaEliminadaEvent({ tareaId: id }));
			}
		});

		return { afectadas: ids.length };
	}
}
