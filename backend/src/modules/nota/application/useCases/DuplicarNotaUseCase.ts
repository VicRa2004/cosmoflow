import { Nota } from "../../domain/Nota";
import type { NotaRepository } from "../../domain/repository/NotaRepository";
import type { NotaDto } from "../dtos/NotaDto";
import { NotaMapper } from "../mappers/NotaMapper";
import type { ProyectosNota } from "../services/ProyectosNota";

const SUFIJO_COPIA = " (copia)";
const MAX_TITULO = 255;

/** Clona una nota en la misma carpeta y ámbito, sin fijar. */
export class DuplicarNotaUseCase {
	constructor(
		private readonly notaRepository: NotaRepository,
		private readonly proyectos: ProyectosNota,
	) {}

	async ejecutar(usuarioId: number, id: number): Promise<NotaDto> {
		const original = await this.proyectos.buscarVisible(usuarioId, id);
		const datos = original.getDatos();
		const titulo = `${datos.titulo.slice(0, MAX_TITULO - SUFIJO_COPIA.length)}${SUFIJO_COPIA}`;
		const copia = Nota.crear(
			usuarioId,
			{
				titulo,
				contenido: datos.contenido,
				color: datos.color,
				isFijada: false,
				tagIds: datos.tagIds,
				carpetaId: datos.carpetaId,
			},
			original.getProyecto(),
		);
		return NotaMapper.toDto(await this.notaRepository.crear(copia));
	}
}
