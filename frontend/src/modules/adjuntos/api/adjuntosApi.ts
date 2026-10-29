import { apiClient } from "@/core/api/client";
import type { components } from "@/core/api/schema.gen";

export type AdjuntoDto = components["schemas"]["AdjuntoDto"];
/** Con quién se comparte la imagen: los miembros de esa organización, equipo o proyecto la ven. */
export type AmbitoAdjunto =
	| { organizacionId: number }
	| { equipoId: number }
	| { proyectoId: number };

export const adjuntosApi = {
	async subir(archivo: File, ambito?: AmbitoAdjunto): Promise<AdjuntoDto> {
		const datos = new FormData();
		datos.append("archivo", archivo);
		// Sin esta cabecera axios convertiría el FormData al JSON por defecto del cliente.
		const response = await apiClient.post<AdjuntoDto>("/adjuntos", datos, {
			headers: { "Content-Type": "multipart/form-data" },
			params: ambito,
		});
		return response.data;
	},

	/** Adjunto privado (`/api/adjuntos/…`) como blob: un `<img src>` no manda el Bearer. */
	async descargar(src: string): Promise<Blob> {
		// El baseURL del cliente ya es `/api`.
		const response = await apiClient.get<Blob>(src.replace(/^\/api/, ""), {
			responseType: "blob",
		});
		return response.data;
	},
};
