import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";

/** Tareas con fecha en un rango: personales y de todo lo que el usuario ve. */
export class ObtenerCalendarioUseCase {
	constructor(private readonly tareaRepository: TareaRepository) {}

	async ejecutar(
		usuarioId: number,
		desde: string,
		hasta: string,
	): Promise<TareaDto[]> {
		const tareas = await this.tareaRepository.buscarCalendario(
			usuarioId,
			desde,
			hasta,
		);
		return tareas.map(TareaMapper.toDto);
	}
}
