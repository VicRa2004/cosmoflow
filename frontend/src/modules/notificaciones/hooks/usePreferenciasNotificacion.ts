import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { notificacionesApi } from "../api/notificacionesApi";

const preferenciasKey = ["notificaciones", "preferencias"] as const;

export function usePreferenciasNotificacionQuery() {
	return useQuery({
		queryKey: preferenciasKey,
		queryFn: notificacionesApi.obtenerPreferencias,
	});
}

/** La respuesta trae la matriz completa: se usa tal cual como nuevo estado. */
export function useActualizarPreferenciasMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: notificacionesApi.actualizarPreferencias,
		onSuccess: (preferencias) =>
			queryClient.setQueryData(preferenciasKey, preferencias),
		onError: (error) => toast.error(getErrorMessage(error)),
	});
}
