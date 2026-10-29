import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import { Tarea } from "../../domain/Tarea";
import type { CrearTareaDto } from "../dtos/CrearTareaDto";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";

export class CrearTareaUseCase {
	constructor(private readonly tareaRepository: TareaRepository) {}

	async ejecutar(usuarioId: number, dto: CrearTareaDto): Promise<TareaDto> {
		const tarea = Tarea.crear(usuarioId, dto);
		const { tagIds } = tarea.getDatos();
		if (
			tagIds.length > 0 &&
			!(await this.tareaRepository.sonTagsPropios(usuarioId, tagIds))
		) {
			throw new TagsAjenosError();
		}
		return TareaMapper.toDto(await this.tareaRepository.crear(tarea));
	}
}
