import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import { type ObtenerTareasParams, tareasApi } from "../api/tareasApi";

export const tareasKeys = {
	all: ["tareas"] as const,
	lists: () => [...tareasKeys.all, "list"] as const,
	list: (params: ObtenerTareasParams) =>
		[...tareasKeys.lists(), params] as const,
	// Bajo `lists()`: las mutaciones que invalidan las listas también la refrescan.
	pendientes: (pagina: number) =>
		[...tareasKeys.lists(), "pendientes", pagina] as const,
	detalle: (id: number) => [...tareasKeys.all, "detalle", id] as const,
};

export function useTareasQuery(params: ObtenerTareasParams = {}) {
	return useQuery({
		queryKey: tareasKeys.list(params),
		queryFn: () => tareasApi.obtenerTodos(params),
		// Mantiene la página anterior visible mientras llega la siguiente.
		placeholderData: keepPreviousData,
	});
}

export function usePendientesQuery(pagina: number) {
	return useQuery({
		queryKey: tareasKeys.pendientes(pagina),
		queryFn: () => tareasApi.obtenerPendientes({ pagina, limite: 20 }),
		placeholderData: keepPreviousData,
	});
}

/** Sin `id` no pide nada (alta). */
export function useTareaQuery(id?: number) {
	return useQuery({
		queryKey: tareasKeys.detalle(id ?? 0),
		queryFn: id === undefined ? skipToken : () => tareasApi.obtenerUno(id),
	});
}
