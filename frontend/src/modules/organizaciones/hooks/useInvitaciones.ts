import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { invitacionesApi } from "../api/invitacionesApi";
import { organizacionesKeys } from "./useOrganizacionesQuery";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

const invitacionesKey = (organizacionId: number) =>
	[...organizacionesKeys.detalle(organizacionId), "invitaciones"] as const;

export function useInvitacionesQuery(organizacionId: number) {
	return useQuery({
		queryKey: invitacionesKey(organizacionId),
		queryFn: () => invitacionesApi.obtenerTodas(organizacionId),
	});
}

/** Invitar, reenviar y cancelar; todas refrescan la lista de pendientes. */
export function useGestionInvitaciones(organizacionId: number) {
	const queryClient = useQueryClient();
	const refrescar = () =>
		queryClient.invalidateQueries({
			queryKey: invitacionesKey(organizacionId),
		});

	return {
		invitar: useMutation({
			mutationFn: (email: string) =>
				invitacionesApi.invitar(organizacionId, email),
			onSuccess: ({ email }) => {
				toast.success(`Invitación enviada a ${email}`);
				return refrescar();
			},
			onError,
		}),
		reenviar: useMutation({
			mutationFn: (id: number) => invitacionesApi.reenviar(organizacionId, id),
			onSuccess: ({ email }) => {
				toast.success(`Invitación reenviada a ${email}`);
				return refrescar();
			},
			onError,
		}),
		cancelar: useMutation({
			mutationFn: (id: number) => invitacionesApi.cancelar(organizacionId, id),
			onSuccess: () => {
				toast.success("Invitación cancelada");
				return refrescar();
			},
			onError,
		}),
	};
}

export function useInvitacionRecibidaQuery(token: string) {
	return useQuery({
		queryKey: ["invitaciones", "recibida", token],
		queryFn: () => invitacionesApi.consultar(token),
		retry: false,
	});
}

/** Al aceptar, refresca mis organizaciones (sidebar incluido). */
export function useResponderInvitacionMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ token, aceptar }: { token: string; aceptar: boolean }) =>
			invitacionesApi.responder(token, aceptar),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: organizacionesKeys.lists() }),
		onError,
	});
}
