import { extraerMenciones } from "@/core/shared/domain/menciones";
import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import { ComentarioNoEncontradoError } from "../../domain/error/ComentarioNoEncontradoError";
import type { ComentarioTareaRepository } from "../../domain/repository/ComentarioTareaRepository";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import { TareaComentadaEvent } from "../../domain/event/TareaComentadaEvent";
import type { ComentarioTareaDto } from "../dtos/ComentarioTareaDto";
import { ComentarioTareaMapper } from "../mappers/ComentarioTareaMapper";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/**
 * Cualquiera que vea la tarea comenta o responde a un hilo (1 nivel). Se avisa a
 * los mencionados (solo quienes ven la tarea), al autor del comentario respondido
 * y a los responsables y creador (`tarea.comentada`).
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
		datos: { contenido: string; padreId?: number | null },
	): Promise<ComentarioTareaDto> {
		const { contexto } = await buscarTareaVisible(
			this.tareaRepository,
			this.contextos,
			usuarioId,
			tareaId,
		);
		const conAcceso = contexto?.miembroIds ?? [];

		let padreIdEfectivo: number | null = null;
		let respondeAAutorId: number | null = null;
		if (datos.padreId != null) {
			const padre = await this.comentarios.buscarPorId(tareaId, datos.padreId);
			if (!padre) throw new ComentarioNoEncontradoError();
			// Hilos de 1 nivel: responder a una respuesta se cuelga del comentario raíz.
			padreIdEfectivo = padre.padreId ?? padre.id;
			if (padre.autorId !== usuarioId && conAcceso.includes(padre.autorId)) {
				respondeAAutorId = padre.autorId;
			}
		}

		const mencionIds = extraerMenciones(datos.contenido).filter(
			(id) => id !== usuarioId && conAcceso.includes(id),
		);
		const creado = await this.uow.ejecutar(async () => {
			const comentario = await this.comentarios.crear({
				tareaId,
				autorId: usuarioId,
				contenido: datos.contenido,
				padreId: padreIdEfectivo,
			});
			await this.eventBus.publish(
				new TareaComentadaEvent({
					tareaId,
					comentarioId: comentario.id,
					autorId: usuarioId,
					mencionIds,
					respondeAAutorId,
				}),
			);
			return comentario;
		});
		return ComentarioTareaMapper.toDto(creado);
	}
}
