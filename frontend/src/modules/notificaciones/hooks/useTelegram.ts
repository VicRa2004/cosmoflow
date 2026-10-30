import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { notificacionesApi } from "../api/notificacionesApi";

const telegramKey = ["notificaciones", "telegram"] as const;
const onError = (error: unknown) => toast.error(getErrorMessage(error));

/** Al volver de Telegram, la pestaña recupera el foco y se refresca sola. */
export function useEstadoTelegramQuery() {
	return useQuery({
		queryKey: telegramKey,
		queryFn: notificacionesApi.estadoTelegram,
	});
}

export function useVincularTelegramMutation() {
	return useMutation({
		mutationFn: notificacionesApi.vincularTelegram,
		onError,
	});
}

export function useDesvincularTelegramMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: notificacionesApi.desvincularTelegram,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: telegramKey }),
		onError,
	});
}
