/** Lo que el módulo de tareas necesita de una organización (tareas sin equipo ni proyecto). */
export interface ContextoTareasOrganizacion {
	organizacionId: number;
	/** Ven sus tareas y pueden ser responsables (RN-23). */
	miembroIds: number[];
	/** Crea, asigna y elimina tareas (RN-22). */
	puedeCrear: boolean;
}

export interface TareasOrganizacion {
	/** `null` si la organización no existe o quien pide no es miembro (404, RN-90). */
	contexto: (
		usuarioId: number,
		organizacionId: number,
	) => Promise<ContextoTareasOrganizacion | null>;
}
