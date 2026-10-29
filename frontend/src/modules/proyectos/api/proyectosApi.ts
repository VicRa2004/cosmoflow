import { apiClient } from "@/core/api/client";
import type { components, paths } from "@/core/api/schema.gen";

export type ProyectoDto = components["schemas"]["ProyectoDto"];
export type EstadoProyecto = components["schemas"]["EstadoProyecto"];
export type GuardarProyectoInput =
	paths["/api/organizaciones/{organizacionId}/proyectos"]["post"]["requestBody"]["content"]["application/json"];

const base = (organizacionId: number) =>
	`/organizaciones/${organizacionId}/proyectos`;

export const proyectosApi = {
	async obtenerTodos(
		organizacionId: number,
		params: { estado?: EstadoProyecto } = {},
	): Promise<ProyectoDto[]> {
		const response = await apiClient.get<ProyectoDto[]>(base(organizacionId), {
			params,
		});
		return response.data;
	},

	async crear(
		organizacionId: number,
		datos: GuardarProyectoInput,
	): Promise<ProyectoDto> {
		const response = await apiClient.post<ProyectoDto>(
			base(organizacionId),
			datos,
		);
		return response.data;
	},

	async actualizar(
		organizacionId: number,
		id: number,
		datos: GuardarProyectoInput,
	): Promise<ProyectoDto> {
		const response = await apiClient.put<ProyectoDto>(
			`${base(organizacionId)}/${id}`,
			datos,
		);
		return response.data;
	},

	async eliminar(organizacionId: number, id: number): Promise<void> {
		await apiClient.delete(`${base(organizacionId)}/${id}`);
	},
};
