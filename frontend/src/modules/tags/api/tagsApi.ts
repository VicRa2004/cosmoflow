import { apiClient } from "@/core/api/client";
import type { components, paths } from "@/core/api/schema.gen";

export type TagDto = components["schemas"]["TagDto"];
export type CrearTagInput =
	paths["/api/tags"]["post"]["requestBody"]["content"]["application/json"];
export type ActualizarTagInput =
	paths["/api/tags/{id}"]["put"]["requestBody"]["content"]["application/json"];
type TagsPagina =
	paths["/api/tags"]["get"]["responses"][200]["content"]["application/json"];

export interface ObtenerTagsParams {
	pagina?: number;
	limite?: number;
	nombre?: string;
}

/** Sin `organizacionId`, los tags personales; con él, los de esa organización (RN-60). */
const base = (organizacionId?: number) =>
	organizacionId ? `/organizaciones/${organizacionId}/tags` : "/tags";

export const tagsApi = {
	async obtenerTodos(
		params: ObtenerTagsParams = {},
		organizacionId?: number,
	): Promise<TagsPagina> {
		const response = await apiClient.get<TagsPagina>(base(organizacionId), {
			params,
		});
		return response.data;
	},

	async crear(datos: CrearTagInput, organizacionId?: number): Promise<TagDto> {
		const response = await apiClient.post<TagDto>(base(organizacionId), datos);
		return response.data;
	},

	async actualizar(
		id: number,
		datos: ActualizarTagInput,
		organizacionId?: number,
	): Promise<TagDto> {
		const response = await apiClient.put<TagDto>(
			`${base(organizacionId)}/${id}`,
			datos,
		);
		return response.data;
	},

	async eliminar(id: number, organizacionId?: number): Promise<void> {
		await apiClient.delete(`${base(organizacionId)}/${id}`);
	},
};
