import type { TareasEquipo } from "@/modules/equipo";
import type { TareasProyecto } from "@/modules/proyecto";

/** ¿Es miembro del equipo o proyecto con el que se comparte el adjunto? */
export class MiembrosAmbito {
	constructor(
		private readonly equipos: TareasEquipo,
		private readonly proyectos: TareasProyecto,
	) {}

	async esMiembro(
		usuarioId: number,
		{
			equipoId,
			proyectoId,
		}: { equipoId?: number | null; proyectoId?: number | null },
	): Promise<boolean> {
		if (equipoId) {
			return (await this.equipos.contexto(usuarioId, equipoId)) !== null;
		}
		if (proyectoId) {
			return (await this.proyectos.contexto(usuarioId, proyectoId)) !== null;
		}
		return false;
	}
}
