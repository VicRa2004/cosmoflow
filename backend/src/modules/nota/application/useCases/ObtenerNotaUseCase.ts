import type { NotaDto } from "../dtos/NotaDto";
import { NotaMapper } from "../mappers/NotaMapper";
import type { ProyectosNota } from "../services/ProyectosNota";

export class ObtenerNotaUseCase {
	constructor(private readonly proyectos: ProyectosNota) {}

	async ejecutar(usuarioId: number, id: number): Promise<NotaDto> {
		return NotaMapper.toDto(await this.proyectos.buscarVisible(usuarioId, id));
	}
}
