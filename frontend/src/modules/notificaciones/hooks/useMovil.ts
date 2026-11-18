import { useQuery } from "@tanstack/react-query";
import { notificacionesApi } from "../api/notificacionesApi";

const movilKey = ["notificaciones", "movil"] as const;

export function useEstadoMovilQuery() {
	return useQuery({
		queryKey: movilKey,
		queryFn: notificacionesApi.estadoMovil,
	});
}
