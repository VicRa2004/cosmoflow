import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { useAuthStore } from "@/core/auth/store";
import { miembrosApi } from "../api/miembrosApi";
import { organizacionesKeys } from "./useOrganizacionesQuery";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

export function useMiembrosQuery(organizacionId: number) {
	return useQuery({
		queryKey: [...organizacionesKeys.detalle(organizacionId), "miembros"],
		queryFn: () => miembrosApi.obtenerTodos(organizacionId),
	});
}

/** Salir, expulsar y delegar cambian miembros, `isAdmin` y mis organizaciones: se refresca todo. */
export function useGestionMiembros(organizacionId: number) {
	const queryClient = useQueryClient();
	const yo = useAuthStore((state) => state.usuario?.id);
	const refrescar = () =>
		queryClient.invalidateQueries({ queryKey: organizacionesKeys.all });

	return {
		quitar: useMutation({
			mutationFn: (usuarioId: number) =>
				miembrosApi.quitar(organizacionId, usuarioId),
			onSuccess: (_, usuarioId) => {
				if (usuarioId !== yo) return refrescar();
				// Al salir, solo las listas: recargar el detalle daría 404 antes de navegar fuera.
				return queryClient.invalidateQueries({
					queryKey: organizacionesKeys.lists(),
				});
			},
			onError,
		}),
		delegar: useMutation({
			mutationFn: (usuarioId: number) =>
				miembrosApi.delegar(organizacionId, usuarioId),
			onSuccess: () => {
				toast.success("Administración delegada");
				return refrescar();
			},
			onError,
		}),
	};
}
