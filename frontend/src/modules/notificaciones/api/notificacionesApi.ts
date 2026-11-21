import { apiClient } from "@/core/api/client";
import type { components } from "@/core/api/schema.gen";

export type EstadoMovil = components["schemas"]["EstadoMovil"];
export type EstadoTelegram = components["schemas"]["EstadoTelegram"];
export type NotificacionApp = components["schemas"]["NotificacionApp"];
export type BandejaNotificaciones =
	components["schemas"]["BandejaNotificaciones"];
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

	async estadoTelegram(): Promise<EstadoTelegram> {
		const response = await apiClient.get<EstadoTelegram>(
			"/notificaciones/telegram",
		);
		return response.data;
	},

	async vincularTelegram(): Promise<string> {
		const response = await apiClient.post<{ enlace: string }>(
			"/notificaciones/telegram/vincular",
		);
		return response.data.enlace;
	},

	async desvincularTelegram(): Promise<void> {
		await apiClient.delete("/notificaciones/telegram");
	},

	async estadoMovil(): Promise<EstadoMovil> {
		const response = await apiClient.get<EstadoMovil>("/notificaciones/movil");
		return response.data;
	},

	async obtenerBandeja(
		params: { pagina?: number; limite?: number; soloNoLeidas?: boolean } = {},
	): Promise<BandejaNotificaciones> {
		const response = await apiClient.get<BandejaNotificaciones>(
			"/notificaciones",
			{
				params: {
					...params,
					soloNoLeidas: params.soloNoLeidas ? "true" : undefined,
				},
			},
		);
		return response.data;
	},

	async marcarLeida(id: number): Promise<void> {
		await apiClient.put(`/notificaciones/${id}/leer`);
	},

	async marcarTodasLeidas(): Promise<void> {
		await apiClient.post("/notificaciones/leer-todas");
	},
};
