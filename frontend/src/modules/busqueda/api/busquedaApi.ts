import { apiClient } from "@/core/api/client";
import type { components } from "@/core/api/schema.gen";

export type ResultadosBusquedaDto =
	components["schemas"]["ResultadosBusquedaDto"];

export const busquedaApi = {
	async buscar(q: string): Promise<ResultadosBusquedaDto> {
		const response = await apiClient.get<ResultadosBusquedaDto>("/busqueda", {
			params: { q },
		});
		return response.data;
	},
};
