import { randomUUID } from "node:crypto";
import type { Almacenamiento } from "@/core/shared/domain/Almacenamiento";
import { detectarTipoImagen } from "@/core/shared/domain/tipoImagen";
import { AvatarOrganizacionInvalidoError } from "../../domain/error/AvatarOrganizacionInvalidoError";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { OrganizacionDto } from "../dtos/OrganizacionDto";
import { OrganizacionMapper } from "../mappers/OrganizacionMapper";
import { buscarConPermiso } from "./buscarConPermiso";

export const AVATAR_ORGANIZACION_MAX_BYTES = 2 * 1024 * 1024;

/** Sube (o con `null` quita) el avatar de la organización y borra el archivo anterior. */
export class CambiarAvatarOrganizacionUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly almacenamiento: Almacenamiento,
	) {}

	async ejecutar(
		usuarioId: number,
		id: number,
		datos: Uint8Array | null,
	): Promise<OrganizacionDto> {
		const encontrada = await buscarConPermiso(
			this.organizacionRepository,
			usuarioId,
			id,
			"organizacion:editar",
		);
		const { organizacion } = encontrada;

		let clave: string | null = null;
		if (datos) {
			if (datos.byteLength > AVATAR_ORGANIZACION_MAX_BYTES) {
				throw new AvatarOrganizacionInvalidoError(
					"El avatar no puede superar los 2 MB",
				);
			}
			const formato = detectarTipoImagen(datos);
			if (!formato) {
				throw new AvatarOrganizacionInvalidoError(
					"El avatar debe ser PNG, JPEG o WebP",
				);
			}
			clave = `organizaciones/${id}-${randomUUID()}.${formato.ext}`;
			await this.almacenamiento.guardar(clave, datos, formato.tipo);
		}

		const anterior = organizacion.getAvatar();
		organizacion.cambiarAvatar(clave);
		try {
			const guardada =
				await this.organizacionRepository.actualizar(organizacion);
			if (anterior) await this.almacenamiento.eliminar(anterior);
			return OrganizacionMapper.toDto({
				...encontrada,
				organizacion: guardada,
			});
		} catch (error) {
			if (clave) await this.almacenamiento.eliminar(clave);
			throw error;
		}
	}
}
