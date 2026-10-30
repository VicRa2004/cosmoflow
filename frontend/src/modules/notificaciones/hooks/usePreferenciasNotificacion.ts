import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import {
	notificacionesApi,
	type PreferenciaNotificacion,
} from "../api/notificacionesApi";

const preferenciasKey = (organizacionId?: number) =>
	["notificaciones", "preferencias", organizacionId ?? "mias"] as const;

/** Sin `organizacionId`, las del usuario; con él, las de la organización. */
export function usePreferenciasNotificacionQuery(organizacionId?: number) {
	return useQuery({
		queryKey: preferenciasKey(organizacionId),
		queryFn: () => notificacionesApi.obtenerPreferencias(organizacionId),
	});
}

/** La respuesta trae la matriz completa: se usa tal cual como nuevo estado. */
export function useActualizarPreferenciasMutation(organizacionId?: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (preferencias: PreferenciaNotificacion[]) =>
			notificacionesApi.actualizarPreferencias(preferencias, organizacionId),
		onSuccess: (preferencias) =>
			queryClient.setQueryData(preferenciasKey(organizacionId), preferencias),
		onError: (error) => toast.error(getErrorMessage(error)),
	});
}
