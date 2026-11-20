import { ComentarioNoEncontradoError } from "../../domain/error/ComentarioNoEncontradoError";
import { SinPermisoComentarioError } from "../../domain/error/SinPermisoComentarioError";
import type { ComentarioTareaRepository } from "../../domain/repository/ComentarioTareaRepository";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/** Su autor o, para moderar, quien gestiona las tareas de ahí (RN-22) o el dueño de la personal. */
export class EliminarComentarioUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
		private readonly comentarios: ComentarioTareaRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		ids: { tareaId: number; id: number },
	): Promise<void> {
		const { contexto } = await buscarTareaVisible(
			this.tareaRepository,
			this.contextos,
			usuarioId,
			ids.tareaId,
		);
		const comentario = await this.comentarios.buscarPorId(ids.tareaId, ids.id);
		if (!comentario) throw new ComentarioNoEncontradoError();
		// Sin contexto es personal: quien llega aquí es su dueño.
		const modera = contexto === null || contexto.puedeCrear;
		if (comentario.autorId !== usuarioId && !modera) {
			throw new SinPermisoComentarioError("eliminar");
		}
		await this.comentarios.eliminar(ids.id);
	}
}
