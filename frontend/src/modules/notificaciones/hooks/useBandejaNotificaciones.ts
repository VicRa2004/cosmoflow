import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { notificacionesApi } from "../api/notificacionesApi";

const CLAVE_BANDEJA = ["notificaciones", "bandeja"] as const;

export function useBandejaNotificacionesQuery(limite = 20) {
	return useQuery({
		queryKey: [...CLAVE_BANDEJA, limite],
		queryFn: () => notificacionesApi.obtenerBandeja({ pagina: 1, limite }),
		refetchInterval: 60_000,
	});
}

export function useMarcarNotificacionLeidaMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => notificacionesApi.marcarLeida(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CLAVE_BANDEJA });
		},
		onError: (error) => toast.error(getErrorMessage(error)),
	});
}

export function useMarcarTodasLeidasMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => notificacionesApi.marcarTodasLeidas(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: CLAVE_BANDEJA });
		},
		onError: (error) => toast.error(getErrorMessage(error)),
	});
}
