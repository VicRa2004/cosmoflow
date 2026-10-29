import type { PermisoOrganizacion } from "../api/rolesOrganizacionApi";
import type { OrganizacionDto } from "../api/organizacionesApi";

/** Texto de cada permiso del catálogo (RN-17). */
export const ETIQUETA_PERMISO: Record<PermisoOrganizacion, string> = {
	"organizacion:editar": "Editar nombre, descripción, color e imagen",
	"miembros:invitar": "Invitar y gestionar invitaciones",
	"miembros:expulsar": "Expulsar miembros",
	"roles:gestionar": "Crear roles y asignarlos",
	"equipos:crear": "Crear equipos",
	"equipos:editar": "Editar equipos",
	"equipos:eliminar": "Eliminar equipos",
	"proyectos:crear": "Crear proyectos",
	"proyectos:editar": "Editar proyectos",
	"proyectos:eliminar": "Eliminar proyectos",
	"tags:gestionar": "Gestionar los tags de la organización",
};

/** Solo oculta en la interfaz: quien decide es siempre el backend. */
export const puedeEn = (
	organizacion: Pick<OrganizacionDto, "permisos">,
	permiso: PermisoOrganizacion,
) => organizacion.permisos.includes(permiso);
