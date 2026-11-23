import { apiClient } from "@/core/api/client";
import type { components } from "@/core/api/schema.gen";

export type DestinoConexion = components["schemas"]["DestinoConexion"];
type SuscripcionCalendario = components["schemas"]["SuscripcionCalendario"];

export const conexionesApi = {
	async obtenerDestino(redirectUri: string): Promise<DestinoConexion> {
		const response = await apiClient.get<DestinoConexion>("/oauth/conexion", {
			params: { redirect_uri: redirectUri },
		});
		return response.data;
	},

	async autorizar(data: {
		clientId: string;
		redirectUri: string;
		codeChallenge: string;
		state?: string;
	}): Promise<string> {
		const response = await apiClient.post<
			components["schemas"]["ConexionAutorizada"]
		>("/oauth/conexion", data);
		return response.data.redirectUri;
	},

	async suscripcionCalendario(): Promise<SuscripcionCalendario> {
		const response = await apiClient.get<SuscripcionCalendario>(
			"/calendario/suscripcion",
		);
		return response.data;
	},

	async generarCalendario(): Promise<string> {
		const response = await apiClient.post<
			components["schemas"]["UrlCalendario"]
		>("/calendario/suscripcion");
		return response.data.url;
	},

	async revocarCalendario(): Promise<void> {
		await apiClient.delete("/calendario/suscripcion");
	},
};
