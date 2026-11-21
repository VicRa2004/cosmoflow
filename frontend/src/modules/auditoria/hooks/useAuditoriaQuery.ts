import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { auditoriaApi, type ObtenerAuditoriaParams } from "../api/auditoriaApi";

export const auditoriaKeys = {
	all: ["auditoria"] as const,
	list: (params: ObtenerAuditoriaParams) =>
		[...auditoriaKeys.all, "list", params] as const,
};

export function useAuditoriaQuery(params: ObtenerAuditoriaParams = {}) {
	return useQuery({
		queryKey: auditoriaKeys.list(params),
		queryFn: () => auditoriaApi.obtenerTodos(params),
		placeholderData: keepPreviousData,
	});
}
