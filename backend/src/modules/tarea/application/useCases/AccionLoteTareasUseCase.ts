import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type {
	AccionLoteTareasDto,
	ResultadoLoteTareasDto,
} from "../dtos/AccionLoteTareasDto";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";
import { validarTarea } from "./validarTarea";

/** Aplica una acción en lote sobre un conjunto de tareas visibles para el usuario. */
export class AccionLoteTareasUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		usuarioId: number,
		dto: AccionLoteTareasDto,
	): Promise<ResultadoLoteTareasDto> {
		const ids = [...new Set(dto.ids)];
		const hoy = new Date().toISOString().slice(0, 10);
		const preparadas = await Promise.all(
			ids.map(async (id) => {
				const { tarea, contexto } = await buscarTareaVisible(
					this.tareaRepository,
					this.contextos,
					usuarioId,
					id,
				);
				const antes = tarea.getDatos();
				if (dto.accion === "estado") {
					tarea.actualizar({ estado: dto.estado });
				} else if (dto.accion === "prioridad") {
					tarea.actualizar({ prioridad: dto.prioridad });
				} else if (dto.accion === "agregar_tag") {
					if (!antes.tagIds.includes(dto.tagId)) {
						tarea.actualizar({ tagIds: [...antes.tagIds, dto.tagId] });
					}
				} else if (dto.accion === "quitar_tag") {
					if (antes.tagIds.includes(dto.tagId)) {
						tarea.actualizar({
							tagIds: antes.tagIds.filter((t) => t !== dto.tagId),
						});
					}
				}
				await validarTarea(this.tareaRepository, tarea, contexto, antes);
				const recienCompletada =
					antes.estado !== "completada" &&
					tarea.getDatos().estado === "completada";
				const siguiente = recienCompletada
					? tarea.siguienteOcurrencia(hoy)
					: null;
				return { tarea, siguiente };
			}),
		);

		await this.uow.ejecutar(async () => {
			for (const { tarea, siguiente } of preparadas) {
				await this.tareaRepository.actualizar(tarea);
				await this.eventBus.publishAll(tarea.pullDomainEvents());
				if (siguiente) {
					const creada = await this.tareaRepository.crear(siguiente);
					creada.agregarEventoCreada();
					await this.eventBus.publishAll(creada.pullDomainEvents());
				}
			}
		});

		return { afectadas: ids.length };
	}
}
