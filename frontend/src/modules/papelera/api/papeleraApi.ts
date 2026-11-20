import { apiClient } from "@/core/api/client";
import type { paths } from "@/core/api/schema.gen";

type TareasPapelera =
	paths["/api/tareas/papelera"]["get"]["responses"][200]["content"]["application/json"];
type NotasPapelera =
	paths["/api/notas/papelera"]["get"]["responses"][200]["content"]["application/json"];

/** Tareas y notas borradas: se purgan solas a los 30 días. */
export type TipoPapelera = "tareas" | "notas";

export const papeleraApi = {
	async tareas(pagina: number): Promise<TareasPapelera> {
		const response = await apiClient.get<TareasPapelera>("/tareas/papelera", {
			params: { pagina, limite: 10 },
		});
		return response.data;
	},

	async notas(pagina: number): Promise<NotasPapelera> {
		const response = await apiClient.get<NotasPapelera>("/notas/papelera", {
			params: { pagina, limite: 10 },
		});
		return response.data;
	},

	async restaurar(tipo: TipoPapelera, id: number): Promise<void> {
		await apiClient.post(`/${tipo}/papelera/${id}/restaurar`);
	},

	async eliminar(tipo: TipoPapelera, id: number): Promise<void> {
		await apiClient.delete(`/${tipo}/papelera/${id}`);
	},
};
