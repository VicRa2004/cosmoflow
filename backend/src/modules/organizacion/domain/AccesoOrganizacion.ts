import type { PermisoOrganizacion } from "./permisosOrganizacion";

/**
 * Barrera única de aislamiento entre organizaciones (RN-90) para los demás módulos
 * (tags, equipos, proyectos, tareas): no repiten consultas de membresía.
 */
export interface AccesoOrganizacion {
	/**
	 * 404 si no es miembro (no se revela que la organización existe); con `permiso`,
	 * además 403 si no lo tiene. El admin los tiene todos.
	 */
	exigir: (
		usuarioId: number,
		organizacionId: number,
		permiso?: PermisoOrganizacion,
	) => Promise<void>;
}
