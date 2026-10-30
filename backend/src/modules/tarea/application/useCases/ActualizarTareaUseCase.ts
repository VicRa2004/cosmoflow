import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ActualizarTareaDto } from "../dtos/ActualizarTareaDto";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";
import { validarTarea } from "./validarTarea";

/** Quien la ve la edita; cambiar responsables exige poder crear tareas ahí (RN-22). */
export class ActualizarTareaUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		usuarioId: number,
		id: number,
		dto: ActualizarTareaDto,
	): Promise<TareaDto> {
		const { tarea, contexto } = await buscarTareaVisible(
			this.tareaRepository,
			this.contextos,
			usuarioId,
			id,
		);
		const { responsableIds, ...campos } = dto;
		if (responsableIds !== undefined) {
			if (contexto && !contexto.puedeCrear) throw new SinPermisoTareasError();
			tarea.asignar(responsableIds);
		}
		tarea.actualizar(campos);
		tarea.mencionar(contexto?.miembroIds ?? []);
		await validarTarea(this.tareaRepository, tarea, contexto);
		const actualizada = await this.uow.ejecutar(async () => {
			const actualizada = await this.tareaRepository.actualizar(tarea);
			await this.eventBus.publishAll(tarea.pullDomainEvents());
			return actualizada;
		});
		return TareaMapper.toDto(actualizada);
	}
}
