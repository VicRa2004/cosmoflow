import { apiClient } from "@/core/api/client";
import type { components } from "@/core/api/schema.gen";

export type AdjuntoDto = components["schemas"]["AdjuntoDto"];

export const adjuntosApi = {
	async subir(archivo: File): Promise<AdjuntoDto> {
		const datos = new FormData();
		datos.append("archivo", archivo);
		// Sin esta cabecera axios convertiría el FormData al JSON por defecto del cliente.
		const response = await apiClient.post<AdjuntoDto>("/adjuntos", datos, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return response.data;
	},
};
