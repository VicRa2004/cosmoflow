import type {
	ActividadTarea,
	ActividadTareaRepository,
} from "../../domain/repository/ActividadTareaRepository";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/** Historial de una tarea que el usuario ve: quién la creó, cambió, movió o comentó. */
export class ObtenerActividadTareaUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
		private readonly actividad: ActividadTareaRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		tareaId: number,
		opciones: { antesDe?: number; limite: number },
	): Promise<ActividadTarea> {
		await buscarTareaVisible(
			this.tareaRepository,
			this.contextos,
			usuarioId,
			tareaId,
		);
		return this.actividad.listar(tareaId, opciones);
	}
}
