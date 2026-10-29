import { apiClient } from "@/core/api/client";
import type { components } from "@/core/api/schema.gen";

export type MiembroDto = components["schemas"]["MiembroDto"];

export const miembrosApi = {
	async obtenerTodos(organizacionId: number): Promise<MiembroDto[]> {
		const response = await apiClient.get<MiembroDto[]>(
			`/organizaciones/${organizacionId}/miembros`,
		);
		return response.data;
	},

	/** Con mi propio id, salgo; con el de otro, lo expulso (solo admin). */
	async quitar(organizacionId: number, usuarioId: number): Promise<void> {
		await apiClient.delete(
			`/organizaciones/${organizacionId}/miembros/${usuarioId}`,
		);
	},

	async delegar(organizacionId: number, usuarioId: number): Promise<void> {
		await apiClient.post(`/organizaciones/${organizacionId}/delegar`, {
			usuarioId,
		});
	},
};
