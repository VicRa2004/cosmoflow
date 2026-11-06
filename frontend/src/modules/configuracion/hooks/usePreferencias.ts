import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import {
	type PreferenciasInterfaz,
	preferenciasApi,
} from "../api/preferenciasApi";
import { aplicarPreferencias } from "../aplicarPreferencias";

const preferenciasKey = ["preferencias"] as const;

/** Las del usuario autenticado (guardadas en el servidor); `undefined` mientras cargan. */
export function usePreferenciasQuery() {
	return useQuery({
		queryKey: preferenciasKey,
		queryFn: preferenciasApi.obtener,
		staleTime: Number.POSITIVE_INFINITY,
	});
}

/** Las aplica a <html> cada vez que cambian. Montado una vez, en el layout. */
export function useAplicarPreferencias() {
	const { data } = usePreferenciasQuery();
	useEffect(() => {
		if (data) aplicarPreferencias(data);
	}, [data]);
}

/** Cambio optimista: se ve al momento y se deshace si el servidor lo rechaza. */
export function useCambiarPreferenciasMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: preferenciasApi.actualizar,
		onMutate: async (cambios) => {
			await queryClient.cancelQueries({ queryKey: preferenciasKey });
			const anteriores =
				queryClient.getQueryData<PreferenciasInterfaz>(preferenciasKey);
			if (anteriores) {
				queryClient.setQueryData(preferenciasKey, {
					...anteriores,
					...cambios,
				});
			}
			return { anteriores };
		},
		onError: (error, _cambios, contexto) => {
			queryClient.setQueryData(preferenciasKey, contexto?.anteriores);
			toast.error(getErrorMessage(error));
		},
		onSuccess: (guardadas) =>
			queryClient.setQueryData(preferenciasKey, guardadas),
	});
}

/** Organizaciones que lista «Nueva» en Pendientes: 20 sin notas y 10 con notas, salvo que elija otra cifra. */
export const limiteOrganizacionesPendientes = (
	p: PreferenciasInterfaz | undefined,
) => p?.pendientesOrganizaciones ?? (p?.pendientesNotas ? 10 : 20);
