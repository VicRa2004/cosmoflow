import { apiClient } from "@/core/api/client";
import type { components, paths } from "@/core/api/schema.gen";

export type NotaDto = components["schemas"]["NotaDto"];
export type CrearNotaInput =
	paths["/api/notas"]["post"]["requestBody"]["content"]["application/json"];
export type ActualizarNotaInput =
	paths["/api/notas/{id}"]["put"]["requestBody"]["content"]["application/json"];
type NotasPagina =
	paths["/api/notas"]["get"]["responses"][200]["content"]["application/json"];
export type CarpetaDto = components["schemas"]["CarpetaDto"];
export type CrearCarpetaInput =
	paths["/api/carpetas"]["post"]["requestBody"]["content"]["application/json"];
export type ActualizarCarpetaInput =
	paths["/api/carpetas/{id}"]["put"]["requestBody"]["content"]["application/json"];
export type ImportarNotasInput =
	paths["/api/notas/importar"]["post"]["requestBody"]["content"]["application/json"];
type ResultadoImportacion = components["schemas"]["ResultadoImportacionDto"];

export interface ObtenerNotasParams {
	pagina?: number;
	limite?: number;
	busqueda?: string;
	tagId?: number;
	/** Solo las que están directamente en esa carpeta. */
	carpetaId?: number;
	/** Título exacto (wikilinks). */
	titulo?: string;
	/** ISO 8601. */
	creadaDesde?: string;
	creadaHasta?: string;
	editadaDesde?: string;
	editadaHasta?: string;
	/** Sin él, las personales. */
	proyectoId?: number;
}

export const notasApi = {
	async obtenerTodos(params: ObtenerNotasParams = {}): Promise<NotasPagina> {
		const response = await apiClient.get<NotasPagina>("/notas", { params });
		return response.data;
	},

	async obtenerUno(id: number): Promise<NotaDto> {
		const response = await apiClient.get<NotaDto>(`/notas/${id}`);
		return response.data;
	},

	async crear(datos: CrearNotaInput): Promise<NotaDto> {
		const response = await apiClient.post<NotaDto>("/notas", datos);
		return response.data;
	},

	async actualizar(id: number, datos: ActualizarNotaInput): Promise<NotaDto> {
		const response = await apiClient.put<NotaDto>(`/notas/${id}`, datos);
		return response.data;
	},

	async eliminar(id: number): Promise<void> {
		await apiClient.delete(`/notas/${id}`);
	},

	async importar(datos: ImportarNotasInput): Promise<ResultadoImportacion> {
		const response = await apiClient.post<ResultadoImportacion>(
			"/notas/importar",
			datos,
		);
		return response.data;
	},
};

export const carpetasApi = {
	/** Sin `proyectoId`, las personales. */
	async obtenerTodas(proyectoId?: number): Promise<CarpetaDto[]> {
		const response = await apiClient.get<CarpetaDto[]>("/carpetas", {
			params: { proyectoId },
		});
		return response.data;
	},

	async crear(datos: CrearCarpetaInput): Promise<CarpetaDto> {
		const response = await apiClient.post<CarpetaDto>("/carpetas", datos);
		return response.data;
	},

	async actualizar(
		id: number,
		datos: ActualizarCarpetaInput,
	): Promise<CarpetaDto> {
		const response = await apiClient.put<CarpetaDto>(`/carpetas/${id}`, datos);
		return response.data;
	},

	async eliminar(id: number): Promise<void> {
		await apiClient.delete(`/carpetas/${id}`);
	},
};
