import { apiClient } from "@/core/api/client";
import type { components, paths } from "@/core/api/schema.gen";

export type PlantillaTareaDto = components["schemas"]["PlantillaTareaDto"];
export type CrearPlantillaInput =
	paths["/api/plantillas"]["post"]["requestBody"]["content"]["application/json"];
export type ActualizarPlantillaInput = NonNullable<
	paths["/api/plantillas/{id}"]["put"]["requestBody"]
>["content"]["application/json"];

/** Sin `organizacionId`, las personales; con él, las de esa organización. */
const base = (organizacionId?: number) =>
	organizacionId
		? `/organizaciones/${organizacionId}/plantillas`
		: "/plantillas";

export const plantillasApi = {
	async obtenerTodas(organizacionId?: number): Promise<PlantillaTareaDto[]> {
		const response = await apiClient.get<PlantillaTareaDto[]>(
			base(organizacionId),
		);
		return response.data;
	},

	async crear(
		datos: CrearPlantillaInput,
		organizacionId?: number,
	): Promise<PlantillaTareaDto> {
		const response = await apiClient.post<PlantillaTareaDto>(
			base(organizacionId),
			datos,
		);
		return response.data;
	},

	async actualizar(
		id: number,
		datos: ActualizarPlantillaInput,
		organizacionId?: number,
	): Promise<PlantillaTareaDto> {
		const response = await apiClient.put<PlantillaTareaDto>(
			`${base(organizacionId)}/${id}`,
			datos,
		);
		return response.data;
	},

	async eliminar(id: number, organizacionId?: number): Promise<void> {
		await apiClient.delete(`${base(organizacionId)}/${id}`);
	},
};
