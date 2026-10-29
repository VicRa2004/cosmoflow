import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ObtenerTagsParams, tagsApi } from "../api/tagsApi";

export const tagsKeys = {
	all: ["tags"] as const,
	lists: () => [...tagsKeys.all, "list"] as const,
	list: (params: ObtenerTagsParams, organizacionId?: number) =>
		[...tagsKeys.lists(), organizacionId ?? null, params] as const,
};

export function useTagsQuery(
	params: ObtenerTagsParams = {},
	organizacionId?: number,
) {
	return useQuery({
		queryKey: tagsKeys.list(params, organizacionId),
		queryFn: () => tagsApi.obtenerTodos(params, organizacionId),
		// Mantiene la página anterior visible mientras llega la siguiente.
		placeholderData: keepPreviousData,
	});
}
