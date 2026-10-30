import { apiClient } from "@/core/api/client";
import type { components } from "@/core/api/schema.gen";

export type PreferenciaNotificacion =
	components["schemas"]["PreferenciaNotificacion"];

export const notificacionesApi = {
	async obtenerPreferencias(): Promise<PreferenciaNotificacion[]> {
		const response = await apiClient.get<PreferenciaNotificacion[]>(
			"/notificaciones/preferencias",
		);
		return response.data;
	},

	async actualizarPreferencias(
		preferencias: PreferenciaNotificacion[],
	): Promise<PreferenciaNotificacion[]> {
		const response = await apiClient.put<PreferenciaNotificacion[]>(
			"/notificaciones/preferencias",
			preferencias,
		);
		return response.data;
	},
};
