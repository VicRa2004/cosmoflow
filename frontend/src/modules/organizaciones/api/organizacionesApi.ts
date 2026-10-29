import { apiClient } from "@/core/api/client";
import type { components, paths } from "@/core/api/schema.gen";

export type OrganizacionDto = components["schemas"]["OrganizacionDto"];
export type CrearOrganizacionInput =
	paths["/api/organizaciones"]["post"]["requestBody"]["content"]["application/json"];
export type ActualizarOrganizacionInput =
	paths["/api/organizaciones/{id}"]["put"]["requestBody"]["content"]["application/json"];
type OrganizacionesPagina =
	paths["/api/organizaciones"]["get"]["responses"][200]["content"]["application/json"];

export interface ObtenerOrganizacionesParams {
	pagina?: number;
	limite?: number;
	nombre?: string;
	/** `recientes`: en las que entró hace menos primero. Por defecto, por nombre. */
	orden?: "nombre" | "recientes";
}

export const organizacionesApi = {
	async obtenerTodos(
		params: ObtenerOrganizacionesParams = {},
	): Promise<OrganizacionesPagina> {
		const response = await apiClient.get<OrganizacionesPagina>(
			"/organizaciones",
			{ params },
		);
		return response.data;
	},

	async obtenerUno(id: number): Promise<OrganizacionDto> {
		const response = await apiClient.get<OrganizacionDto>(
			`/organizaciones/${id}`,
		);
		return response.data;
	},

	async crear(datos: CrearOrganizacionInput): Promise<OrganizacionDto> {
		const response = await apiClient.post<OrganizacionDto>(
			"/organizaciones",
			datos,
		);
		return response.data;
	},

	async actualizar(
		id: number,
		datos: ActualizarOrganizacionInput,
	): Promise<OrganizacionDto> {
		const response = await apiClient.put<OrganizacionDto>(
			`/organizaciones/${id}`,
			datos,
		);
		return response.data;
	},

	async eliminar(id: number): Promise<void> {
		await apiClient.delete(`/organizaciones/${id}`);
	},

	async subirAvatar(id: number, archivo: File): Promise<OrganizacionDto> {
		const datos = new FormData();
		datos.append("archivo", archivo);
		// Sin esta cabecera axios convertiría el FormData al JSON por defecto del cliente.
		const response = await apiClient.put<OrganizacionDto>(
			`/organizaciones/${id}/avatar`,
			datos,
			{ headers: { "Content-Type": "multipart/form-data" } },
		);
		return response.data;
	},

	async eliminarAvatar(id: number): Promise<OrganizacionDto> {
		const response = await apiClient.delete<OrganizacionDto>(
			`/organizaciones/${id}/avatar`,
		);
		return response.data;
	},
};
