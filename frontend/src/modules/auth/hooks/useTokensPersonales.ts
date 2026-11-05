import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { authApi } from "../api/authApi";

const tokensKey = ["auth", "tokens-personales"] as const;
const onError = (error: unknown) => toast.error(getErrorMessage(error));

export function useTokensPersonalesQuery() {
	return useQuery({ queryKey: tokensKey, queryFn: authApi.tokensPersonales });
}

/** El valor del token queda en `data` de la mutación: nunca en la caché de la lista. */
export function useCrearTokenPersonalMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: authApi.crearTokenPersonal,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: tokensKey }),
		onError,
	});
}

export function useRevocarTokenPersonalMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: authApi.revocarTokenPersonal,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: tokensKey }),
		onError,
	});
}
