import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { conexionesApi } from "../api/conexionesApi";

/** Un destino rechazado no mejora reintentando. */
export function useDestinoConexionQuery(redirectUri?: string) {
	return useQuery({
		queryKey: ["conexiones", "destino", redirectUri],
		queryFn: () => conexionesApi.obtenerDestino(redirectUri ?? ""),
		enabled: redirectUri !== undefined,
		retry: false,
	});
}

export function useAutorizarConexionMutation() {
	return useMutation({
		mutationFn: conexionesApi.autorizar,
		onSuccess: (redirectUri) => window.location.assign(redirectUri),
		onError: (error) => toast.error(getErrorMessage(error)),
	});
}
