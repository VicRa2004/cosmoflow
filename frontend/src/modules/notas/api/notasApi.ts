import { apiClient } from "@/core/api/client";
import type { components, paths } from "@/core/api/schema.gen";

export type NotaDto = components["schemas"]["NotaDto"];
export type CrearNotaInput =
	paths["/api/notas"]["post"]["requestBody"]["content"]["application/json"];
export type ActualizarNotaInput =
	paths["/api/notas/{id}"]["put"]["requestBody"]["content"]["application/json"];
type NotasPagina =
	paths["/api/notas"]["get"]["responses"][200]["content"]["application/json"];

export interface ObtenerNotasParams {
	pagina?: number;
	limite?: number;
	busqueda?: string;
	tagId?: number;
	/** Sin él, las personales. */
	proyectoId?: number;
}

export const notasApi = {
	async obtenerTodos(params: ObtenerNotasParams = {}): Promise<NotasPagina> {
		const response = await apiClient.get<NotasPagina>("/notas", { params });
		return response.data;
	},

	async obtenerUno(id: number): Promise<NotaDto> {
		const response = await apiClient.get<NotaDto>(`/notas/${id}`);
		return response.data;
	},

	async crear(datos: CrearNotaInput): Promise<NotaDto> {
		const response = await apiClient.post<NotaDto>("/notas", datos);
		return response.data;
	},

	async actualizar(id: number, datos: ActualizarNotaInput): Promise<NotaDto> {
		const response = await apiClient.put<NotaDto>(`/notas/${id}`, datos);
		return response.data;
	},

	async eliminar(id: number): Promise<void> {
		await apiClient.delete(`/notas/${id}`);
	},
};
