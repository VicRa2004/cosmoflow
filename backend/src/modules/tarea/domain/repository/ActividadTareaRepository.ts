/** Eventos de una tarea que se muestran en su historial (sale de la auditoría). */
export const EVENTOS_ACTIVIDAD = [
	"tarea.creada",
	"tarea.actualizada",
	"tarea.estadoCambiado",
	"tarea.responsablesAsignados",
	"tarea.movida",
	"tarea.eliminada",
	"tarea.restaurada",
	"tarea.comentada",
] as const;

export interface EntradaActividad {
	id: number;
	evento: (typeof EVENTOS_ACTIVIDAD)[number];
	datos: unknown;
	/** `null` si lo hizo el sistema (p. ej. un job). */
	actorId: number | null;
	ocurridoEn: Date;
}

export interface ActividadTarea {
	datos: EntradaActividad[];
	/** Nombre de cada usuario citado: actores y `usuarioIds` de los datos. */
	nombres: Record<number, string>;
	hayMas: boolean;
}

export interface ActividadTareaRepository {
	/** Lo más reciente primero; `antesDe` pagina por cursor (id de la entrada). */
	listar(
		tareaId: number,
		opciones: { antesDe?: number; limite: number },
	): Promise<ActividadTarea>;
}
