import { apiClient } from "@/core/api/client";
import type { components, paths } from "@/core/api/schema.gen";

export type ComentarioTareaDto = components["schemas"]["ComentarioTareaDto"];
export type ActividadTarea = components["schemas"]["ActividadTarea"];
export type EntradaActividad = ActividadTarea["datos"][number];
type ComentariosPagina =
	paths["/api/tareas/{id}/comentarios"]["get"]["responses"][200]["content"]["application/json"];

export const comentariosApi = {
	// shortcut: solo la primera página (100); paginar cuando una tarea pase de ahí.
	async obtenerTodos(tareaId: number): Promise<ComentariosPagina> {
		const response = await apiClient.get<ComentariosPagina>(
			`/tareas/${tareaId}/comentarios`,
			{ params: { limite: 100 } },
		);
		return response.data;
	},

	async crear(tareaId: number, contenido: string): Promise<ComentarioTareaDto> {
		const response = await apiClient.post<ComentarioTareaDto>(
			`/tareas/${tareaId}/comentarios`,
			{ contenido },
		);
		return response.data;
	},

	async actualizar(
		tareaId: number,
		id: number,
		contenido: string,
	): Promise<ComentarioTareaDto> {
		const response = await apiClient.put<ComentarioTareaDto>(
			`/tareas/${tareaId}/comentarios/${id}`,
			{ contenido },
		);
		return response.data;
	},

	/** Lo más reciente primero; `antesDe` = id de la última entrada ya recibida. */
	async actividad(tareaId: number, antesDe?: number): Promise<ActividadTarea> {
		const response = await apiClient.get<ActividadTarea>(
			`/tareas/${tareaId}/actividad`,
			{ params: { antesDe } },
		);
		return response.data;
	},

	async eliminar(tareaId: number, id: number): Promise<void> {
		await apiClient.delete(`/tareas/${tareaId}/comentarios/${id}`);
	},
};
