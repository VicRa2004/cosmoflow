import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	type ObtenerOrganizacionesParams,
	organizacionesApi,
} from "../api/organizacionesApi";

export const organizacionesKeys = {
	all: ["organizaciones"] as const,
	lists: () => [...organizacionesKeys.all, "list"] as const,
	list: (params: ObtenerOrganizacionesParams) =>
		[...organizacionesKeys.lists(), params] as const,
	detalle: (id: number) => [...organizacionesKeys.all, "detalle", id] as const,
};

export function useOrganizacionesQuery(
	params: ObtenerOrganizacionesParams = {},
) {
	return useQuery({
		queryKey: organizacionesKeys.list(params),
		queryFn: () => organizacionesApi.obtenerTodos(params),
		// Mantiene la página anterior visible mientras llega la siguiente.
		placeholderData: keepPreviousData,
	});
}

export function useOrganizacionQuery(id: number) {
	return useQuery({
		queryKey: organizacionesKeys.detalle(id),
		queryFn: () => organizacionesApi.obtenerUno(id),
	});
}
