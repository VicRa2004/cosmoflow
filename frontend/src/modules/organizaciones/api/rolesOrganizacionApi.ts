import { apiClient } from "@/core/api/client";
import type { components } from "@/core/api/schema.gen";

export type RolOrganizacionDto = components["schemas"]["RolOrganizacionDto"];
export type PermisoOrganizacion = components["schemas"]["PermisoOrganizacion"];
type CatalogoDto = components["schemas"]["CatalogoPermisosOrganizacion"];
export interface GuardarRolInput {
	nombre: string;
	permisos: PermisoOrganizacion[];
}

const base = (organizacionId: number) =>
	`/organizaciones/${organizacionId}/roles`;

export const rolesOrganizacionApi = {
	async catalogo(organizacionId: number): Promise<CatalogoDto> {
		const response = await apiClient.get<CatalogoDto>(
			`${base(organizacionId)}/catalogo`,
		);
		return response.data;
	},

	async obtenerTodos(organizacionId: number): Promise<RolOrganizacionDto[]> {
		const response = await apiClient.get<RolOrganizacionDto[]>(
			base(organizacionId),
		);
		return response.data;
	},

	async crear(
		organizacionId: number,
		datos: GuardarRolInput,
	): Promise<RolOrganizacionDto> {
		const response = await apiClient.post<RolOrganizacionDto>(
			base(organizacionId),
			datos,
		);
		return response.data;
	},

	async actualizar(
		organizacionId: number,
		id: number,
		datos: GuardarRolInput,
	): Promise<RolOrganizacionDto> {
		const response = await apiClient.put<RolOrganizacionDto>(
			`${base(organizacionId)}/${id}`,
			datos,
		);
		return response.data;
	},

	async eliminar(organizacionId: number, id: number): Promise<void> {
		await apiClient.delete(`${base(organizacionId)}/${id}`);
	},

	async asignar(
		organizacionId: number,
		usuarioId: number,
		rolIds: number[],
	): Promise<void> {
		await apiClient.put(
			`/organizaciones/${organizacionId}/miembros/${usuarioId}/roles`,
			{ rolIds },
		);
	},
};
