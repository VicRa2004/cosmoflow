import type { CarpetaNota } from "../../domain/CarpetaNota";
import { CarpetaInvalidaError } from "../../domain/error/CarpetaInvalidaError";
import { CarpetaNoEncontradaError } from "../../domain/error/CarpetaNoEncontradaError";
import type { CarpetaNotaRepository } from "../../domain/repository/CarpetaNotaRepository";
import { ambitoDe, type ProyectosNota } from "./ProyectosNota";

/** Mismas reglas de visibilidad que las notas (RN-33, RN-50, RN-90). */
export class CarpetasNota {
	constructor(
		private readonly carpetaRepository: CarpetaNotaRepository,
		private readonly proyectos: ProyectosNota,
	) {}

	async buscarVisible(usuarioId: number, id: number): Promise<CarpetaNota> {
		const carpeta = await this.carpetaRepository.buscarPorId(id);
		if (!carpeta || !(await this.proyectos.ve(usuarioId, carpeta))) {
			throw new CarpetaNoEncontradaError();
		}
		return carpeta;
	}

	/** El padre es del mismo ámbito y no es ella misma ni una descendiente. */
	async validarPadre(carpeta: CarpetaNota): Promise<void> {
		const { padreId } = carpeta.getDatos();
		if (padreId === null) return;
		const padres = new Map(
			(await this.carpetaRepository.buscar(ambitoDe(carpeta))).map((c) => [
				c.getId(),
				c.getDatos().padreId,
			]),
		);
		if (!padres.has(padreId)) throw new CarpetaInvalidaError();
		if (carpeta.esNueva()) return;
		// Sube desde el padre nuevo: si llega a ella, sería un ciclo.
		const propia = carpeta.getId();
		for (let id: number | null = padreId; id !== null; ) {
			if (id === propia) {
				throw new CarpetaInvalidaError(
					"Una carpeta no puede ir dentro de sí misma",
				);
			}
			id = padres.get(id) ?? null;
		}
	}
}
