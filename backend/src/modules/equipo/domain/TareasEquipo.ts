/** Lo que el módulo de tareas necesita de un equipo. */
export interface ContextoTareasEquipo {
	organizacionId: number;
	/** Ven sus tareas y pueden ser responsables (RN-23). */
	miembroIds: number[];
	/** Crea, asigna y elimina tareas (RN-22). */
	puedeCrear: boolean;
}

export interface TareasEquipo {
	/** `null` si el equipo no existe o quien pide no es miembro (404, RN-90). */
	contexto: (
		usuarioId: number,
		equipoId: number,
	) => Promise<ContextoTareasEquipo | null>;
}
