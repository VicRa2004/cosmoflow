import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query";
import {
	type ObtenerIndiceParams,
	type ObtenerNotasParams,
	notasApi,
} from "../api/notasApi";

export const notasKeys = {
	all: ["notas"] as const,
	lists: () => [...notasKeys.all, "list"] as const,
	list: (params: ObtenerNotasParams) => [...notasKeys.lists(), params] as const,
	detalle: (id: number) => [...notasKeys.all, "detalle", id] as const,
	explorador: () => [...notasKeys.all, "explorador"] as const,
};

export function useNotasQuery(params: ObtenerNotasParams = {}, activa = true) {
	return useQuery({
		queryKey: notasKeys.list(params),
		queryFn: activa ? () => notasApi.obtenerTodos(params) : skipToken,
		// Mantiene la página anterior visible mientras llega la siguiente.
		placeholderData: keepPreviousData,
	});
}

/** Todas las notas que encajan: el árbol del explorador se monta en el cliente. */
export function useExploradorNotas(params: ObtenerIndiceParams) {
	return useQuery({
		queryKey: [...notasKeys.explorador(), params],
		queryFn: () => notasApi.obtenerIndice(params),
		placeholderData: keepPreviousData,
	});
}

/**
 * Sin `id` no pide nada (alta). El editor solo lee el valor inicial: sin caché al
 * reabrir ni refresco al volver a la pestaña, para no autoguardar sobre datos viejos.
 */
export function useNotaQuery(id?: number) {
	return useQuery({
		queryKey: notasKeys.detalle(id ?? 0),
		queryFn: id === undefined ? skipToken : () => notasApi.obtenerUno(id),
		gcTime: 0,
		refetchOnWindowFocus: false,
	});
}
