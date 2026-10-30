import { apiClient } from "@/core/api/client";
import type { components, paths } from "@/core/api/schema.gen";

export type TareaDto = components["schemas"]["TareaDto"];
export type CrearTareaInput =
	paths["/api/tareas"]["post"]["requestBody"]["content"]["application/json"];
export type ActualizarTareaInput =
	paths["/api/tareas/{id}"]["put"]["requestBody"]["content"]["application/json"];
type TareasPagina =
	paths["/api/tareas"]["get"]["responses"][200]["content"]["application/json"];

export type EstadoTarea = TareaDto["estado"];
export type PrioridadTarea = TareaDto["prioridad"];

export interface ObtenerTareasParams {
	pagina?: number;
	limite?: number;
	busqueda?: string;
	estado?: EstadoTarea;
	tagId?: number;
	/** Sin destino, las personales; `organizacionId` solo, las de la organización. */
	organizacionId?: number;
	/** En las que se es responsable, de cualquier contexto (sin destino). */
	asignadas?: boolean;
	equipoId?: number;
	proyectoId?: number;
}

/** RN-45: de personal a la organización, a un equipo o a un proyecto. */
export type DestinoTarea =
	| { organizacionId: number }
	| { equipoId: number }
	| { proyectoId: number };

/** Destino de una tarea compartida: equipo, proyecto o, si no, la organización sola. */
export const destinoDe = ({
	organizacionId,
	equipoId,
	proyectoId,
}: {
	organizacionId: number;
	equipoId?: number | null;
	proyectoId?: number | null;
}): DestinoTarea =>
	equipoId ? { equipoId } : proyectoId ? { proyectoId } : { organizacionId };

export const tareasApi = {
	async obtenerTodos(params: ObtenerTareasParams = {}): Promise<TareasPagina> {
		const response = await apiClient.get<TareasPagina>("/tareas", { params });
		return response.data;
	},

	async obtenerPendientes(
		params: { pagina?: number; limite?: number } = {},
	): Promise<TareasPagina> {
		const response = await apiClient.get<TareasPagina>("/tareas/pendientes", {
			params,
		});
		return response.data;
	},

	async obtenerUno(id: number): Promise<TareaDto> {
		const response = await apiClient.get<TareaDto>(`/tareas/${id}`);
		return response.data;
	},

	async crear(datos: CrearTareaInput): Promise<TareaDto> {
		const response = await apiClient.post<TareaDto>("/tareas", datos);
		return response.data;
	},

	async actualizar(id: number, datos: ActualizarTareaInput): Promise<TareaDto> {
		const response = await apiClient.put<TareaDto>(`/tareas/${id}`, datos);
		return response.data;
	},

	async mover(id: number, destino: DestinoTarea): Promise<TareaDto> {
		const response = await apiClient.post<TareaDto>(
			`/tareas/${id}/mover`,
			destino,
		);
		return response.data;
	},

	async eliminar(id: number): Promise<void> {
		await apiClient.delete(`/tareas/${id}`);
	},
};
