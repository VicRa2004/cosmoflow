import { apiClient } from "@/core/api/client";
import type { components, paths } from "@/core/api/schema.gen";

export type EquipoDto = components["schemas"]["EquipoDto"];
export type CrearEquipoInput =
	paths["/api/organizaciones/{organizacionId}/equipos"]["post"]["requestBody"]["content"]["application/json"];

const base = (organizacionId: number) =>
	`/organizaciones/${organizacionId}/equipos`;

export const equiposApi = {
	async obtenerTodos(
		organizacionId: number,
		params: { tagId?: number } = {},
	): Promise<EquipoDto[]> {
		const response = await apiClient.get<EquipoDto[]>(base(organizacionId), {
			params,
		});
		return response.data;
	},

	async crear(
		organizacionId: number,
		datos: CrearEquipoInput,
	): Promise<EquipoDto> {
		const response = await apiClient.post<EquipoDto>(
			base(organizacionId),
			datos,
		);
		return response.data;
	},

	async actualizar(
		organizacionId: number,
		id: number,
		datos: CrearEquipoInput,
	): Promise<EquipoDto> {
		const response = await apiClient.put<EquipoDto>(
			`${base(organizacionId)}/${id}`,
			datos,
		);
		return response.data;
	},

	async delegados(
		organizacionId: number,
		id: number,
		usuarioIds: number[],
	): Promise<EquipoDto> {
		const response = await apiClient.put<EquipoDto>(
			`${base(organizacionId)}/${id}/delegados`,
			{ usuarioIds },
		);
		return response.data;
	},

	async subirAvatar(
		organizacionId: number,
		id: number,
		archivo: File,
	): Promise<EquipoDto> {
		const datos = new FormData();
		datos.append("archivo", archivo);
		// Sin esta cabecera axios convertiría el FormData al JSON por defecto del cliente.
		const response = await apiClient.put<EquipoDto>(
			`${base(organizacionId)}/${id}/avatar`,
			datos,
			{ headers: { "Content-Type": "multipart/form-data" } },
		);
		return response.data;
	},

	async eliminarAvatar(organizacionId: number, id: number): Promise<EquipoDto> {
		const response = await apiClient.delete<EquipoDto>(
			`${base(organizacionId)}/${id}/avatar`,
		);
		return response.data;
	},

	async eliminar(organizacionId: number, id: number): Promise<void> {
		await apiClient.delete(`${base(organizacionId)}/${id}`);
	},
};
