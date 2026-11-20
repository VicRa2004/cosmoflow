import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { ComentarioTareaRepository } from "../../domain/repository/ComentarioTareaRepository";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ComentarioTareaDto } from "../dtos/ComentarioTareaDto";
import { ComentarioTareaMapper } from "../mappers/ComentarioTareaMapper";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/** Los de una tarea que el usuario ve, los más antiguos primero. */
export class ObtenerComentariosUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
		private readonly comentarios: ComentarioTareaRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		tareaId: number,
		paginacion: { pagina: number; limite: number },
	): Promise<Paginacion<ComentarioTareaDto>> {
		await buscarTareaVisible(
			this.tareaRepository,
			this.contextos,
			usuarioId,
			tareaId,
		);
		const resultado = await this.comentarios.listar(tareaId, paginacion);
		return {
			...resultado,
			datos: resultado.datos.map(ComentarioTareaMapper.toDto),
		};
	}
}
