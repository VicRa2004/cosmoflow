import type { Almacenamiento } from "@/core/shared/domain/Almacenamiento";
import type { AdjuntoRepository } from "../../domain/repository/AdjuntoRepository";

/** Margen para subir una imagen antes de guardar la tarea o nota que la enlaza. */
const MARGEN_MS = 24 * 60 * 60 * 1000;
/** Por ejecución: lo que quede se borra en la siguiente. */
const LOTE = 200;

/**
 * Borra las imágenes que ya no enlaza ninguna tarea ni nota (se quitaron del
 * markdown o su tarea o nota se purgó de la papelera). Primero el archivo: si
 * falla, la fila queda y se reintenta en la próxima ejecución.
 */
export class LimpiarAdjuntosHuerfanosUseCase {
	constructor(
		private readonly adjuntoRepository: AdjuntoRepository,
		private readonly almacenamiento: Almacenamiento,
	) {}

	async ejecutar(ahora = new Date()): Promise<number> {
		const huerfanos = await this.adjuntoRepository.buscarHuerfanos(
			new Date(ahora.getTime() - MARGEN_MS),
			LOTE,
		);
		for (const { id, clave } of huerfanos) {
			await this.almacenamiento.eliminar(clave);
			await this.adjuntoRepository.eliminar(id);
		}
		return huerfanos.length;
	}
}
