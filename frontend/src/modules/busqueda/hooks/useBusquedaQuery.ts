import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { busquedaApi } from "../api/busquedaApi";

/** Búsqueda global (`GET /api/busqueda`): solo desde 2 caracteres, como exige el backend. */
export function useBusquedaQuery(texto: string, enabled: boolean) {
	const q = texto.trim();
	return useQuery({
		queryKey: ["busqueda", q],
		queryFn: () => busquedaApi.buscar(q),
		enabled: enabled && q.length >= 2,
		// Mantiene los resultados anteriores mientras llega la siguiente tecla.
		placeholderData: keepPreviousData,
	});
}
