import type { Paginacion } from "@/core/shared/domain/Paginacion";
import { ContextoNoEncontradoError } from "../../domain/error/ContextoNoEncontradoError";
import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ObtenerTareasDto } from "../dtos/ObtenerTareasDto";
import type { TareaDto } from "../dtos/TareaDto";
import { TareaMapper } from "../mappers/TareaMapper";
import type { ContextosTarea } from "../services/ContextosTarea";
import { destinoDe } from "./destinoDe";

/**
 * Las personales, las asignadas, o las de una organización, equipo o proyecto
 * del que se es miembro. Ser responsable implica verla (decisión 27).
 */
export class ObtenerTareasUseCase {
	constructor(
		private readonly tareaRepository: TareaRepository,
		private readonly contextos: ContextosTarea,
	) {}

	async ejecutar(
		usuarioId: number,
		{
			asignadas,
			organizacionId,
			equipoId,
			proyectoId,
			...filtros
		}: ObtenerTareasDto,
	): Promise<Paginacion<TareaDto>> {
		const destino = destinoDe({ organizacionId, equipoId, proyectoId });
		if (destino && !(await this.contextos.de(usuarioId, destino))) {
			throw new ContextoNoEncontradoError();
		}
		const resultado = await this.tareaRepository.buscar(
			destino ?? (asignadas ? { responsableId: usuarioId } : { usuarioId }),
			filtros,
		);
		return { ...resultado, datos: resultado.datos.map(TareaMapper.toDto) };
	}
}
