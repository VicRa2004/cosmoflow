import { TareaInvalidaError } from "../../domain/error/TareaInvalidaError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { DestinoTarea } from "../../domain/Tarea";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/** RN-45: personal → equipo o proyecto, con los permisos del destino (RN-22). Nunca al revés. */
export class MoverTareaUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
	) {}

	async ejecutar(
		usuarioId: number,
		id: number,
		destino: DestinoTarea,
	): Promise<TareaDto> {
		const { tarea } = await buscarTareaVisible(
			this.tareaRepository,
			this.contextos,
			usuarioId,
			id,
		);
		if (!tarea.esPersonal()) {
			throw new TareaInvalidaError(
				"Una tarea de equipo o proyecto no se puede mover",
			);
		}
		const contexto = await this.contextos.exigirCrear(usuarioId, destino);
		tarea.mover({ organizacionId: contexto.organizacionId, ...destino });
		return TareaMapper.toDto(await this.tareaRepository.actualizar(tarea));
	}
}
