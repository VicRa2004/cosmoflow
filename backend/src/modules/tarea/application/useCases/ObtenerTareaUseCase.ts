import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

export class ObtenerTareaUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
	) {}

	async ejecutar(usuarioId: number, id: number): Promise<TareaDto> {
		const { tarea } = await buscarTareaVisible(
			this.tareaRepository,
			this.contextos,
			usuarioId,
			id,
		);
		return TareaMapper.toDto(tarea);
	}
}
