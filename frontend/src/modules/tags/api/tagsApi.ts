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

export const tagsApi = {
	async obtenerTodos(params: ObtenerTagsParams = {}): Promise<TagsPagina> {
		const response = await apiClient.get<TagsPagina>("/tags", { params });
		return response.data;
	},

	async crear(datos: CrearTagInput): Promise<TagDto> {
		const response = await apiClient.post<TagDto>("/tags", datos);
		return response.data;
	},

	async actualizar(id: number, datos: ActualizarTagInput): Promise<TagDto> {
		const response = await apiClient.put<TagDto>(`/tags/${id}`, datos);
		return response.data;
	},

	async eliminar(id: number): Promise<void> {
		await apiClient.delete(`/tags/${id}`);
	},
};
