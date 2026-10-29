/**
 * Catálogo fijo de permisos dentro de una organización (RN-17, decisión 19 de Dudas).
 * Los roles solo pueden combinar estos; el administrador los tiene todos.
 * Borrar uno de aquí lo retira de todos los roles sin migración: se filtra al leer.
 */
export const PERMISOS_ORGANIZACION = [
	"organizacion:editar",
	"miembros:invitar",
	"miembros:expulsar",
	"roles:gestionar",
	"equipos:crear",
	"equipos:editar",
	"equipos:eliminar",
	"proyectos:crear",
	"proyectos:editar",
	"proyectos:eliminar",
	"tags:gestionar",
] as const;

export type PermisoOrganizacion = (typeof PERMISOS_ORGANIZACION)[number];

/** Plantillas que el admin copia y ajusta al crear un rol (RN-17). */
export const PLANTILLAS_ROL: {
	nombre: string;
	permisos: PermisoOrganizacion[];
}[] = [
	{
		nombre: "Editor",
		permisos: [
			"equipos:crear",
			"equipos:editar",
			"equipos:eliminar",
			"proyectos:crear",
			"proyectos:editar",
			"proyectos:eliminar",
			"tags:gestionar",
		],
	},
	// Solo ver: ser miembro ya da lectura.
	{ nombre: "Lector", permisos: [] },
];

const CATALOGO = new Set<string>(PERMISOS_ORGANIZACION);

export const esPermisoOrganizacion = (p: string): p is PermisoOrganizacion =>
	CATALOGO.has(p);

/** Lo que puede hacer un miembro: todo si es admin; si no, la unión de sus roles. */
export function permisosEfectivos(miembro: {
	isAdmin: boolean;
	permisos: string[];
}): PermisoOrganizacion[] {
	if (miembro.isAdmin) return [...PERMISOS_ORGANIZACION];
	return PERMISOS_ORGANIZACION.filter((p) => miembro.permisos.includes(p));
}
