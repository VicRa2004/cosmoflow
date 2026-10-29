import type { Almacenamiento } from "@/core/shared/domain/Almacenamiento";
import { AvatarOrganizacionNoEncontradoError } from "../../domain/error/AvatarOrganizacionNoEncontradoError";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";

const TIPOS: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	webp: "image/webp",
};

/** Solo para miembros: el avatar se sirve comprobando acceso, como los adjuntos. */
export class ObtenerAvatarOrganizacionUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly almacenamiento: Almacenamiento,
	) {}

	async ejecutar(
		usuarioId: number,
		id: number,
	): Promise<{ datos: Uint8Array<ArrayBuffer>; tipo: string }> {
		const clave = (
			await this.organizacionRepository.buscarPorId(usuarioId, id)
		)?.organizacion.getAvatar();
		const datos = clave ? await this.almacenamiento.obtener(clave) : null;
		if (!clave || !datos) {
			throw new AvatarOrganizacionNoEncontradoError();
		}
		const ext = clave.slice(clave.lastIndexOf(".") + 1);
		return { datos, tipo: TIPOS[ext] ?? "application/octet-stream" };
	}
}
