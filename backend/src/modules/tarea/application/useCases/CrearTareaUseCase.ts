import type { TareaRepository } from "../../domain/repository/TareaRepository";
import { Tarea } from "../../domain/Tarea";
import type { CrearTareaDto } from "../dtos/CrearTareaDto";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";
import type { ContextosTarea } from "../services/ContextosTarea";
import { destinoDe } from "./destinoDe";
import { validarTarea } from "./validarTarea";

/** Personal, o en la organización, un equipo o un proyecto respetando RN-22. */
export class CrearTareaUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
	) {}

	async ejecutar(usuarioId: number, dto: CrearTareaDto): Promise<TareaDto> {
		const { organizacionId, equipoId, proyectoId, responsableIds, ...campos } =
			dto;
		const destino = destinoDe({ organizacionId, equipoId, proyectoId });
		const contexto = destino
			? await this.contextos.exigirCrear(usuarioId, destino)
			: null;
		const tarea = Tarea.crear(
			usuarioId,
			campos,
			destino && contexto
				? { organizacionId: contexto.organizacionId, ...destino }
				: undefined,
		);
		if (responsableIds) tarea.asignar(responsableIds);
		await validarTarea(this.tareaRepository, tarea, contexto);
		return TareaMapper.toDto(await this.tareaRepository.crear(tarea));
	}
}
