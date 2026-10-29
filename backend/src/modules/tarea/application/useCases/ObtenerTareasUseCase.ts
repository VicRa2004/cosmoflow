import type { TareaRepository } from "../../domain/repository/TareaRepository";
import type { ObtenerTareasDto } from "../dtos/ObtenerTareasDto";
import type { TareaDto } from "../dtos/TareaDto";
import type { Paginacion } from "@/core/shared/domain/Paginacion";
import { TareaMapper } from "../mappers/TareaMapper";

export class ObtenerTareasUseCase {
	constructor(private readonly tareaRepository: TareaRepository) {}

	async ejecutar(
		usuarioId: number,
		dto: ObtenerTareasDto,
	): Promise<Paginacion<TareaDto>> {
		const resultado = await this.tareaRepository.buscar(usuarioId, dto);
		return { ...resultado, datos: resultado.datos.map(TareaMapper.toDto) };
	}
}
