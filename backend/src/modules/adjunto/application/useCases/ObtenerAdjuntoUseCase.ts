import type { Almacenamiento } from "@/core/shared/domain/Almacenamiento";
import { AdjuntoNoEncontradoError } from "../../domain/error/AdjuntoNoEncontradoError";
import type { AdjuntoRepository } from "../../domain/repository/AdjuntoRepository";
import type { MiembrosAmbito } from "../services/MiembrosAmbito";

/** Lo ve su dueño y, si está compartido, los miembros de ese equipo o proyecto. */
export class ObtenerAdjuntoUseCase {
	constructor(
		private readonly adjuntoRepository: AdjuntoRepository,
		private readonly almacenamiento: Almacenamiento,
		private readonly miembros: MiembrosAmbito,
	) {}

	async ejecutar(
		usuarioId: number,
		id: number,
	): Promise<{ datos: Uint8Array<ArrayBuffer>; tipo: string }> {
		const adjunto = await this.adjuntoRepository.buscarPorId(id);
		const visible =
			adjunto &&
			(adjunto.usuarioId === usuarioId ||
				(await this.miembros.esMiembro(usuarioId, adjunto)));
		const datos = visible
			? await this.almacenamiento.obtener(adjunto.clave)
			: null;
		if (!visible || !datos) {
			throw new AdjuntoNoEncontradoError();
		}
		return { datos, tipo: adjunto.tipo };
	}
}
