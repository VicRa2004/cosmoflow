import type { PermisoOrganizacion } from "../../domain/permisosOrganizacion";

export interface RolOrganizacionDto {
	id: number;
	nombre: string;
	permisos: PermisoOrganizacion[];
	totalMiembros: number;
}

export interface GuardarRolDto {
	nombre: string;
	permisos: PermisoOrganizacion[];
}
