import type { CompartirAdjuntos } from "@/modules/adjunto";
import { TareaInvalidaError } from "../../domain/error/TareaInvalidaError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { DestinoTarea } from "../../domain/Tarea";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";
import type { ContextosTarea } from "../services/ContextosTarea";
import { buscarTareaVisible } from "./buscarTareaVisible";

/** `![](/api/adjuntos/12)` → 12: las imágenes que enlaza el markdown. */
const adjuntosEnlazados = (markdown: string) =>
	[...markdown.matchAll(/\/api\/adjuntos\/(\d+)/g)].map((m) => Number(m[1]));

/**
 * RN-45: personal → organización, equipo o proyecto, con los permisos del destino (RN-22). Nunca al
 * revés. Sus imágenes propias pasan a verse en el destino.
 */
export class MoverTareaUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
		private readonly adjuntos: CompartirAdjuntos,
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
			throw new TareaInvalidaError("Una tarea compartida no se puede mover");
		}
		const contexto = await this.contextos.exigirCrear(usuarioId, destino);
		tarea.mover({ organizacionId: contexto.organizacionId, ...destino });
		const movida = await this.tareaRepository.actualizar(tarea);
		await this.adjuntos.compartir(
			usuarioId,
			adjuntosEnlazados(tarea.getDatos().contenido),
			destino,
		);
		return TareaMapper.toDto(movida);
	}
}
