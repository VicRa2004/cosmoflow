import { extraerMenciones } from "@/core/shared/domain/menciones";
import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import { ComentarioNoEncontradoError } from "../../domain/error/ComentarioNoEncontradoError";
import { SinPermisoComentarioError } from "../../domain/error/SinPermisoComentarioError";
import { TareaMencionadosEvent } from "../../domain/event/TareaMencionadosEvent";
import type { ComentarioTareaRepository } from "../../domain/repository/ComentarioTareaRepository";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ComentarioTareaDto } from "../dtos/ComentarioTareaDto";
import { ComentarioTareaMapper } from "../mappers/ComentarioTareaMapper";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/**
 * Solo su autor, mientras vea la tarea. Si al editar agrega menciones nuevas,
 * notifica únicamente a los nuevos mencionados con acceso.
 */
export class ActualizarComentarioUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
		private readonly comentarios: ComentarioTareaRepository,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		usuarioId: number,
		ids: { tareaId: number; id: number },
		contenido: string,
	): Promise<ComentarioTareaDto> {
		const { contexto } = await buscarTareaVisible(
			this.tareaRepository,
			this.contextos,
			usuarioId,
			ids.tareaId,
		);
		const comentario = await this.comentarios.buscarPorId(ids.tareaId, ids.id);
		if (!comentario) throw new ComentarioNoEncontradoError();
		if (comentario.autorId !== usuarioId) {
			throw new SinPermisoComentarioError("editar");
		}
		const anteriores = new Set(extraerMenciones(comentario.contenido));
		const conAcceso = contexto?.miembroIds ?? [];
		const nuevasMenciones = extraerMenciones(contenido).filter(
			(id) => id !== usuarioId && !anteriores.has(id) && conAcceso.includes(id),
		);

		const actualizado = await this.uow.ejecutar(async () => {
			const res = await this.comentarios.actualizar(ids.id, contenido);
			if (nuevasMenciones.length > 0) {
				await this.eventBus.publish(
					new TareaMencionadosEvent({
						tareaId: ids.tareaId,
						usuarioIds: nuevasMenciones,
					}),
				);
			}
			return res;
		});
		return ComentarioTareaMapper.toDto(actualizado);
	}
}
