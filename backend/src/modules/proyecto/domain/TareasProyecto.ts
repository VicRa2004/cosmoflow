/** Lo que el módulo de tareas necesita de un proyecto. */
export interface ContextoTareasProyecto {
	organizacionId: number;
	/** Miembros de sus equipos más los integrantes sueltos (RN-32, 33). */
	miembroIds: number[];
	/** Cualquier miembro del proyecto crea y asigna sus tareas. */
	puedeCrear: boolean;
}

export interface TareasProyecto {
	/** `null` si el proyecto no existe o quien pide no es miembro (404, RN-90). */
	contexto: (
		usuarioId: number,
		proyectoId: number,
	) => Promise<ContextoTareasProyecto | null>;
}
