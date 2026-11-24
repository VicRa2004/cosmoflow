import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { authApi } from "../api/authApi";

const DOS_PASOS_KEY = ["auth", "dos-pasos"] as const;
const onError = (error: unknown) => toast.error(getErrorMessage(error));

export function useDosPasosQuery() {
	return useQuery({ queryKey: DOS_PASOS_KEY, queryFn: authApi.dosPasos });
}

export function useIniciarDosPasosMutation() {
	return useMutation({ mutationFn: authApi.iniciarDosPasos, onError });
}

/** No refresca el estado al activar: la tarjeta sigue mostrando los códigos hasta «Hecho». */
export function useActivarDosPasosMutation() {
	return useMutation({ mutationFn: authApi.activarDosPasos, onError });
}

export function useDesactivarDosPasosMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: authApi.desactivarDosPasos,
		onSuccess: ({ mensaje }) => {
			toast.success(mensaje);
			return queryClient.invalidateQueries({ queryKey: DOS_PASOS_KEY });
		},
		onError,
	});
}

export function useRefrescarDosPasos() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: DOS_PASOS_KEY });
}
