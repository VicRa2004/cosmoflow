import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import { type ObtenerNotasParams, notasApi } from "../api/notasApi";

export const notasKeys = {
	all: ["notas"] as const,
	lists: () => [...notasKeys.all, "list"] as const,
	list: (params: ObtenerNotasParams) => [...notasKeys.lists(), params] as const,
	detalle: (id: number) => [...notasKeys.all, "detalle", id] as const,
};

export function useNotasQuery(params: ObtenerNotasParams = {}) {
	return useQuery({
		queryKey: notasKeys.list(params),
		queryFn: () => notasApi.obtenerTodos(params),
		// Mantiene la página anterior visible mientras llega la siguiente.
		placeholderData: keepPreviousData,
	});
}

/** Sin `id` no pide nada (alta). */
export function useNotaQuery(id?: number) {
	return useQuery({
		queryKey: notasKeys.detalle(id ?? 0),
		queryFn: id === undefined ? skipToken : () => notasApi.obtenerUno(id),
	});
}
