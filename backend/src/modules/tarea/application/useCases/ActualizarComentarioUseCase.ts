import { ComentarioNoEncontradoError } from "../../domain/error/ComentarioNoEncontradoError";
import { SinPermisoComentarioError } from "../../domain/error/SinPermisoComentarioError";
import type { ComentarioTareaRepository } from "../../domain/repository/ComentarioTareaRepository";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ComentarioTareaDto } from "../dtos/ComentarioTareaDto";
import { ComentarioTareaMapper } from "../mappers/ComentarioTareaMapper";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/**
 * Solo su autor, mientras vea la tarea.
 * shortcut: editar no avisa a quien se menciona de nuevo; publicar `tarea.comentada` con los nuevos si se echa en falta.
 */
export class ActualizarComentarioUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
		private readonly comentarios: ComentarioTareaRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		ids: { tareaId: number; id: number },
		contenido: string,
	): Promise<ComentarioTareaDto> {
		await buscarTareaVisible(
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
		return ComentarioTareaMapper.toDto(
			await this.comentarios.actualizar(ids.id, contenido),
		);
	}
}
