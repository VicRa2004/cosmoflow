import { apiClient } from "@/core/api/client";
import type { components } from "@/core/api/schema.gen";

export type PreferenciasInterfaz =
	components["schemas"]["PreferenciasInterfaz"];

export const preferenciasApi = {
	async obtener(): Promise<PreferenciasInterfaz> {
		const response = await apiClient.get<PreferenciasInterfaz>("/preferencias");
		return response.data;
	},

	async actualizar(
		cambios: Partial<PreferenciasInterfaz>,
	): Promise<PreferenciasInterfaz> {
		const response = await apiClient.put<PreferenciasInterfaz>(
			"/preferencias",
			cambios,
		);
		return response.data;
	},
};
