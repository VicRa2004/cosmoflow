import { apiClient } from "@/core/api/client";
import type { components } from "@/core/api/schema.gen";

export type PreferenciaNotificacion =
	components["schemas"]["PreferenciaNotificacion"];
/** `personalizado` solo existe en las del usuario. */
export type PreferenciaMostrada = PreferenciaNotificacion & {
	personalizado?: boolean;
};

/** Sin `organizacionId`, las del usuario autenticado; con él, los valores por defecto de esa organización. */
const ruta = (organizacionId?: number) =>
	organizacionId === undefined
		? "/notificaciones/preferencias"
		: `/organizaciones/${organizacionId}/notificaciones`;

export const notificacionesApi = {
	async obtenerPreferencias(
		organizacionId?: number,
	): Promise<PreferenciaMostrada[]> {
		const response = await apiClient.get<PreferenciaMostrada[]>(
			ruta(organizacionId),
		);
		return response.data;
	},

	async actualizarPreferencias(
		preferencias: PreferenciaNotificacion[],
		organizacionId?: number,
	): Promise<PreferenciaMostrada[]> {
		const response = await apiClient.put<PreferenciaMostrada[]>(
			ruta(organizacionId),
			preferencias,
		);
		return response.data;
	},
};
