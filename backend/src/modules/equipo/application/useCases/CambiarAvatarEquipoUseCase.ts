import { randomUUID } from "node:crypto";
import type { Almacenamiento } from "@/core/shared/domain/Almacenamiento";
import { detectarTipoImagen } from "@/core/shared/domain/tipoImagen";
import type { AccesoOrganizacion } from "@/modules/organizacion";
import { EquipoInvalidoError } from "../../domain/error/EquipoInvalidoError";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";
import type { AmbitoEquipo, EquipoDto } from "../dtos/EquipoDto";
import { EquipoMapper } from "../mappers/EquipoMapper";
import { buscarEquipo } from "./buscarEquipo";

export const AVATAR_EQUIPO_MAX_BYTES = 2 * 1024 * 1024;

/** Sube (o con `null` quita) la foto del equipo y borra el archivo anterior (`equipos:editar`). */
export class CambiarAvatarEquipoUseCase {
	constructor(
		private readonly equipoRepository: EquipoRepository,
		private readonly acceso: AccesoOrganizacion,
		private readonly almacenamiento: Almacenamiento,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoEquipo,
		id: number,
		datos: Uint8Array | null,
	): Promise<EquipoDto> {
		await this.acceso.exigir(usuarioId, organizacionId, "equipos:editar");
		const equipo = await buscarEquipo(
			this.equipoRepository,
			organizacionId,
			id,
		);

		let clave: string | null = null;
		if (datos) {
			if (datos.byteLength > AVATAR_EQUIPO_MAX_BYTES) {
				throw new EquipoInvalidoError("La foto no puede superar los 2 MB");
			}
			const formato = detectarTipoImagen(datos);
			if (!formato) {
				throw new EquipoInvalidoError("La foto debe ser PNG, JPEG o WebP");
			}
			clave = `equipos/${id}-${randomUUID()}.${formato.ext}`;
			await this.almacenamiento.guardar(clave, datos, formato.tipo);
		}

		const anterior = equipo.getAvatar();
		equipo.cambiarAvatar(clave);
		try {
			const guardado = await this.equipoRepository.actualizar(equipo);
			if (anterior) await this.almacenamiento.eliminar(anterior);
			return EquipoMapper.toDto(guardado);
		} catch (error) {
			if (clave) await this.almacenamiento.eliminar(clave);
			throw error;
		}
	}
}
