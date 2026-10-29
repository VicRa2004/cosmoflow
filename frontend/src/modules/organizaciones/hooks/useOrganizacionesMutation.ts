import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import {
	type ActualizarOrganizacionInput,
	type OrganizacionDto,
	organizacionesApi,
} from "../api/organizacionesApi";
import { organizacionesKeys } from "./useOrganizacionesQuery";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

/** Tras guardar: el detalle con la respuesta y las listas (sidebar incluido) de nuevo. */
function useRefrescar() {
	const queryClient = useQueryClient();
	return (organizacion?: OrganizacionDto) => {
		if (organizacion) {
			queryClient.setQueryData(
				organizacionesKeys.detalle(organizacion.id),
				organizacion,
			);
		}
		return queryClient.invalidateQueries({
			queryKey: organizacionesKeys.lists(),
		});
	};
}

export function useCrearOrganizacionMutation() {
	const refrescar = useRefrescar();
	return useMutation({
		mutationFn: organizacionesApi.crear,
		onSuccess: (organizacion) => {
			toast.success("Organización creada");
			return refrescar(organizacion);
		},
		onError,
	});
}

export function useActualizarOrganizacionMutation() {
	const refrescar = useRefrescar();
	return useMutation({
		mutationFn: ({
			id,
			datos,
		}: {
			id: number;
			datos: ActualizarOrganizacionInput;
		}) => organizacionesApi.actualizar(id, datos),
		onSuccess: (organizacion) => {
			toast.success("Organización guardada");
			return refrescar(organizacion);
		},
		onError,
	});
}

/** Sube (con archivo) o quita (con `null`) el avatar de la organización. */
export function useAvatarOrganizacionMutation(id: number) {
	const refrescar = useRefrescar();
	return useMutation({
		mutationFn: (archivo: File | null) =>
			archivo
				? organizacionesApi.subirAvatar(id, archivo)
				: organizacionesApi.eliminarAvatar(id),
		onSuccess: refrescar,
		onError,
	});
}

export function useEliminarOrganizacionMutation() {
	const refrescar = useRefrescar();
	return useMutation({
		mutationFn: organizacionesApi.eliminar,
		onSuccess: () => {
			toast.success("Organización eliminada");
			return refrescar();
		},
		onError,
	});
}
