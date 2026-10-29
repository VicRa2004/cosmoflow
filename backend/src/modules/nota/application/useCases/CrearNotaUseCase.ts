import { Nota } from "../../domain/Nota";
import type { NotaRepository } from "../../domain/repository/NotaRepository";
import type { CrearNotaDto } from "../dtos/CrearNotaDto";
import type { NotaDto } from "../dtos/NotaDto";
import { NotaMapper } from "../mappers/NotaMapper";
import type { ProyectosNota } from "../services/ProyectosNota";

/** Personal, o en un proyecto del que se es miembro (RN-33). */
export class CrearNotaUseCase {
	constructor(
		private readonly notaRepository: NotaRepository,
		private readonly proyectos: ProyectosNota,
	) {}

	async ejecutar(
		usuarioId: number,
		{ proyectoId, ...campos }: CrearNotaDto,
	): Promise<NotaDto> {
		const proyecto = proyectoId
			? await this.proyectos.exigir(usuarioId, proyectoId)
			: null;
		const nota = Nota.crear(usuarioId, campos, proyecto);
		await this.proyectos.validarTags(nota);
		return NotaMapper.toDto(await this.notaRepository.crear(nota));
	}
}
