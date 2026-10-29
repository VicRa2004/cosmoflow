import type { NotaRepository } from "../../domain/repository/NotaRepository";
import type { ActualizarNotaDto } from "../dtos/ActualizarNotaDto";
import type { NotaDto } from "../dtos/NotaDto";
import { NotaMapper } from "../mappers/NotaMapper";
import type { ProyectosNota } from "../services/ProyectosNota";

/** Quien la ve la edita: su dueño o, si es de proyecto, cualquier miembro. */
export class ActualizarNotaUseCase {
	constructor(
		private readonly notaRepository: NotaRepository,
		private readonly proyectos: ProyectosNota,
	) {}

	async ejecutar(
		usuarioId: number,
		id: number,
		dto: ActualizarNotaDto,
	): Promise<NotaDto> {
		const nota = await this.proyectos.buscarVisible(usuarioId, id);
		nota.actualizar(dto);
		await this.proyectos.validarTags(nota);
		return NotaMapper.toDto(await this.notaRepository.actualizar(nota));
	}
}
