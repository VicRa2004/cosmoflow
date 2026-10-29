import type { TareasEquipo } from "@/modules/equipo";
import type { TareasOrganizacion } from "@/modules/organizacion";
import type { TareasProyecto } from "@/modules/proyecto";

/** ¿Es miembro de la organización, equipo o proyecto con el que se comparte el adjunto? */
export class MiembrosAmbito {
	constructor(
		private readonly equipos: TareasEquipo,
		private readonly proyectos: TareasProyecto,
		private readonly organizaciones: TareasOrganizacion,
	) {}

	async esMiembro(
		usuarioId: number,
		{
			organizacionId,
			equipoId,
			proyectoId,
		}: {
			organizacionId?: number | null;
			equipoId?: number | null;
			proyectoId?: number | null;
		},
	): Promise<boolean> {
		if (equipoId) {
			return (await this.equipos.contexto(usuarioId, equipoId)) !== null;
		}
		if (proyectoId) {
			return (await this.proyectos.contexto(usuarioId, proyectoId)) !== null;
		}
		if (organizacionId) {
			return (
				(await this.organizaciones.contexto(usuarioId, organizacionId)) !== null
			);
		}
		return false;
	}
}
