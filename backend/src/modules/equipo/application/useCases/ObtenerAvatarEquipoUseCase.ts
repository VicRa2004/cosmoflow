import type { Almacenamiento } from "@/core/shared/domain/Almacenamiento";
import type { AccesoOrganizacion } from "@/modules/organizacion";
import { EquipoNoEncontradoError } from "../../domain/error/EquipoNoEncontradoError";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";
import type { AmbitoEquipo } from "../dtos/EquipoDto";
import { buscarEquipo } from "./buscarEquipo";

const TIPOS: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	webp: "image/webp",
};

/** Solo para miembros de la organización: se sirve comprobando acceso, como los adjuntos. */
export class ObtenerAvatarEquipoUseCase {
	constructor(
		private readonly equipoRepository: EquipoRepository,
		private readonly acceso: AccesoOrganizacion,
		private readonly almacenamiento: Almacenamiento,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoEquipo,
		id: number,
	): Promise<{ datos: Uint8Array<ArrayBuffer>; tipo: string }> {
		await this.acceso.exigir(usuarioId, organizacionId);
		const clave = (
			await buscarEquipo(this.equipoRepository, organizacionId, id)
		).getAvatar();
		const datos = clave ? await this.almacenamiento.obtener(clave) : null;
		if (!clave || !datos) {
			throw new EquipoNoEncontradoError("El equipo no tiene foto");
		}
		const ext = clave.slice(clave.lastIndexOf(".") + 1);
		return { datos, tipo: TIPOS[ext] ?? "application/octet-stream" };
	}
}
