import { extraerMenciones } from "@/core/shared/domain/menciones";
import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import type { ComentarioTareaRepository } from "../../domain/repository/ComentarioTareaRepository";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import { TareaComentadaEvent } from "../../domain/event/TareaComentadaEvent";
import type { ComentarioTareaDto } from "../dtos/ComentarioTareaDto";
import { ComentarioTareaMapper } from "../mappers/ComentarioTareaMapper";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/**
 * Cualquiera que vea la tarea comenta. Se avisa a los mencionados (solo quienes
 * ven la tarea) y a sus responsables y creador (`tarea.comentada`).
 */
export class CrearComentarioUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
		private readonly comentarios: ComentarioTareaRepository,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		usuarioId: number,
		tareaId: number,
		contenido: string,
	): Promise<ComentarioTareaDto> {
		const { contexto } = await buscarTareaVisible(
			this.tareaRepository,
			this.contextos,
			usuarioId,
			tareaId,
		);
		const conAcceso = contexto?.miembroIds ?? [];
		const mencionIds = extraerMenciones(contenido).filter(
			(id) => id !== usuarioId && conAcceso.includes(id),
		);
		const creado = await this.uow.ejecutar(async () => {
			const comentario = await this.comentarios.crear({
				tareaId,
				autorId: usuarioId,
				contenido,
			});
			await this.eventBus.publish(
				new TareaComentadaEvent({
					tareaId,
					comentarioId: comentario.id,
					autorId: usuarioId,
					mencionIds,
				}),
			);
			return comentario;
		});
		return ComentarioTareaMapper.toDto(creado);
	}
}
