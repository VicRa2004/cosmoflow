import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { conexionesApi } from "../api/conexionesApi";

const calendarioKey = ["conexiones", "calendario"] as const;
const onError = (error: unknown) => toast.error(getErrorMessage(error));

export function useSuscripcionCalendarioQuery() {
	return useQuery({
		queryKey: calendarioKey,
		queryFn: conexionesApi.suscripcionCalendario,
	});
}

/** La URL queda en `data` de la mutación: el servidor solo guarda su hash. */
export function useGenerarCalendarioMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: conexionesApi.generarCalendario,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: calendarioKey }),
		onError,
	});
}

export function useRevocarCalendarioMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: conexionesApi.revocarCalendario,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: calendarioKey }),
		onError,
	});
}
