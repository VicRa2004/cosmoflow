import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ObtenerTagsParams, tagsApi } from "../api/tagsApi";

export const tagsKeys = {
	all: ["tags"] as const,
	lists: () => [...tagsKeys.all, "list"] as const,
	list: (params: ObtenerTagsParams) => [...tagsKeys.lists(), params] as const,
};

export function useTagsQuery(params: ObtenerTagsParams = {}) {
	return useQuery({
		queryKey: tagsKeys.list(params),
		queryFn: () => tagsApi.obtenerTodos(params),
		// Mantiene la página anterior visible mientras llega la siguiente.
		placeholderData: keepPreviousData,
	});
}
