import { ContextoNoEncontradoError } from "../../domain/error/ContextoNoEncontradoError";
import type {
	EstadisticasTareas,
	TareaRepository,
} from "../../domain/repository/TareaRepository";
import type { ContextosTarea } from "../services/ContextosTarea";
import { destinoDe } from "./destinoDe";

/** Recuentos de las tareas de una organización, equipo o proyecto del que se es miembro. */
export class ObtenerEstadisticasTareasUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
	) {}

	async ejecutar(
		usuarioId: number,
		ubicacion: {
			organizacionId?: number;
			equipoId?: number;
			proyectoId?: number;
		},
	): Promise<EstadisticasTareas> {
		const destino = destinoDe(ubicacion);
		if (!destino || !(await this.contextos.de(usuarioId, destino))) {
			throw new ContextoNoEncontradoError();
		}
		return this.tareaRepository.contar(destino);
	}
}
