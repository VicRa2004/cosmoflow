import { TagsAjenosError } from "../../domain/error/TagsAjenosError";
import { TareaNoEncontradaError } from "../../domain/error/TareaNoEncontradaError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ActualizarTareaDto } from "../dtos/ActualizarTareaDto";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";

export class ActualizarTareaUseCase {
	constructor(private readonly tareaRepository: TareaRepository) {}

	async ejecutar(
		usuarioId: number,
		id: number,
		dto: ActualizarTareaDto,
	): Promise<TareaDto> {
		const tarea = await this.tareaRepository.buscarPorId(usuarioId, id);
		if (!tarea) {
			throw new TareaNoEncontradaError();
		}
		if (
			dto.tagIds?.length &&
			!(await this.tareaRepository.sonTagsPropios(usuarioId, dto.tagIds))
		) {
			throw new TagsAjenosError();
		}
		tarea.actualizar(dto);
		return TareaMapper.toDto(await this.tareaRepository.actualizar(tarea));
	}
}
