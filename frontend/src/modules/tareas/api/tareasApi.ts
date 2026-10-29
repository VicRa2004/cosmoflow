import { apiClient } from "@/core/api/client";
import type { components, paths } from "@/core/api/schema.gen";

export type TareaDto = components["schemas"]["TareaDto"];
export type CrearTareaInput =
	paths["/api/tareas"]["post"]["requestBody"]["content"]["application/json"];
export type ActualizarTareaInput =
	paths["/api/tareas/{id}"]["put"]["requestBody"]["content"]["application/json"];
type TareasPagina =
	paths["/api/tareas"]["get"]["responses"][200]["content"]["application/json"];

export type EstadoTarea = TareaDto["estado"];
export type PrioridadTarea = TareaDto["prioridad"];

export interface ObtenerTareasParams {
	pagina?: number;
	limite?: number;
	busqueda?: string;
	estado?: EstadoTarea;
	tagId?: number;
}

export const tareasApi = {
	async obtenerTodos(params: ObtenerTareasParams = {}): Promise<TareasPagina> {
		const response = await apiClient.get<TareasPagina>("/tareas", { params });
		return response.data;
	},

	async crear(datos: CrearTareaInput): Promise<TareaDto> {
		const response = await apiClient.post<TareaDto>("/tareas", datos);
		return response.data;
	},

	async actualizar(id: number, datos: ActualizarTareaInput): Promise<TareaDto> {
		const response = await apiClient.put<TareaDto>(`/tareas/${id}`, datos);
		return response.data;
	},

	async eliminar(id: number): Promise<void> {
		await apiClient.delete(`/tareas/${id}`);
	},
};
