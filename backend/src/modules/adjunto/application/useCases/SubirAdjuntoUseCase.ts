import { randomUUID } from "node:crypto";
import type { Almacenamiento } from "@/core/shared/domain/Almacenamiento";
import { detectarTipoImagen } from "@/core/shared/domain/tipoImagen";
import { AdjuntoInvalidoError } from "../../domain/error/AdjuntoInvalidoError";
import type { AdjuntoRepository } from "../../domain/repository/AdjuntoRepository";
import type { AdjuntoDto } from "../dtos/AdjuntoDto";

export const ADJUNTO_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Guarda una imagen del usuario. No se vincula a una tarea o nota: el markdown
 * la referencia por URL, así se puede subir antes de guardar la tarea.
 * shortcut: las imágenes que se quitan del markdown quedan huérfanas en disco; añadir una limpieza programada si el espacio importa.
 */
export class SubirAdjuntoUseCase {
	constructor(
		private readonly adjuntoRepository: AdjuntoRepository,
		private readonly almacenamiento: Almacenamiento,
	) {}

	async ejecutar(usuarioId: number, datos: Uint8Array): Promise<AdjuntoDto> {
		if (datos.byteLength > ADJUNTO_MAX_BYTES) {
			throw new AdjuntoInvalidoError("La imagen no puede superar los 5 MB");
		}
		const formato = detectarTipoImagen(datos);
		if (!formato) {
			throw new AdjuntoInvalidoError("La imagen debe ser PNG, JPEG o WebP");
		}

		const clave = `adjuntos/${usuarioId}/${randomUUID()}.${formato.ext}`;
		await this.almacenamiento.guardar(clave, datos, formato.tipo);
		try {
			const adjunto = await this.adjuntoRepository.crear({
				usuarioId,
				clave,
				tipo: formato.tipo,
				bytes: datos.byteLength,
			});
			return {
				id: adjunto.id,
				url: `/api/adjuntos/${adjunto.id}`,
				tipo: adjunto.tipo,
				bytes: adjunto.bytes,
			};
		} catch (error) {
			await this.almacenamiento.eliminar(clave);
			throw error;
		}
	}
}
