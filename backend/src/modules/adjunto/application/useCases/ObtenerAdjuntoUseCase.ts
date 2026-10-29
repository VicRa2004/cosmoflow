import type { Almacenamiento } from "@/core/shared/domain/Almacenamiento";
import { AdjuntoNoEncontradoError } from "../../domain/error/AdjuntoNoEncontradoError";
import type { AdjuntoRepository } from "../../domain/repository/AdjuntoRepository";

export class ObtenerAdjuntoUseCase {
	constructor(
		private readonly adjuntoRepository: AdjuntoRepository,
		private readonly almacenamiento: Almacenamiento,
	) {}

	async ejecutar(
		usuarioId: number,
		id: number,
	): Promise<{ datos: Uint8Array<ArrayBuffer>; tipo: string }> {
		const adjunto = await this.adjuntoRepository.buscarPorId(usuarioId, id);
		const datos = adjunto
			? await this.almacenamiento.obtener(adjunto.clave)
			: null;
		if (!adjunto || !datos) {
			throw new AdjuntoNoEncontradoError();
		}
		return { datos, tipo: adjunto.tipo };
	}
}
