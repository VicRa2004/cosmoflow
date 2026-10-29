import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ObtenerTareasParams, tareasApi } from "../api/tareasApi";

export const tareasKeys = {
	all: ["tareas"] as const,
	lists: () => [...tareasKeys.all, "list"] as const,
	list: (params: ObtenerTareasParams) =>
		[...tareasKeys.lists(), params] as const,
};

export function useTareasQuery(params: ObtenerTareasParams = {}) {
	return useQuery({
		queryKey: tareasKeys.list(params),
		queryFn: () => tareasApi.obtenerTodos(params),
		// Mantiene la página anterior visible mientras llega la siguiente.
		placeholderData: keepPreviousData,
	});
}
