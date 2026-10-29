import type { TareasEquipo } from "@/modules/equipo";
import type { TareasProyecto } from "@/modules/proyecto";
import { ContextoNoEncontradoError } from "../../domain/error/ContextoNoEncontradoError";
import { SinPermisoTareasError } from "../../domain/error/SinPermisoTareasError";
import type { DestinoTarea } from "../../domain/Tarea";

export interface ContextoTarea {
	organizacionId: number;
	/** Ven sus tareas y pueden ser responsables (RN-23). */
	miembroIds: number[];
	/** Crea, asigna y elimina tareas (RN-22). */
	puedeCrear: boolean;
}

/** Equipo o proyecto de una tarea compartida, visto por quien pide. */
export class ContextosTarea {
	constructor(
		private readonly equipos: TareasEquipo,
		private readonly proyectos: TareasProyecto,
	) {}

	/** `null` si no existe o no es miembro. */
	async de(
		usuarioId: number,
		ubicacion: { equipoId?: number | null; proyectoId?: number | null },
	): Promise<ContextoTarea | null> {
		if (ubicacion.equipoId) {
			return this.equipos.contexto(usuarioId, ubicacion.equipoId);
		}
		if (ubicacion.proyectoId) {
			return this.proyectos.contexto(usuarioId, ubicacion.proyectoId);
		}
		return null;
	}

	/** Para crear o mover ahí: 404 si no lo ve, 403 sin permiso (RN-22). */
	async exigirCrear(
		usuarioId: number,
		destino: DestinoTarea,
	): Promise<ContextoTarea> {
		const contexto = await this.de(usuarioId, destino);
		if (!contexto) throw new ContextoNoEncontradoError();
		if (!contexto.puedeCrear) throw new SinPermisoTareasError();
		return contexto;
	}
}
