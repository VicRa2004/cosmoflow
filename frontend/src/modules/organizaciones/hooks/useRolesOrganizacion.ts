import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import {
	type GuardarRolInput,
	rolesOrganizacionApi,
} from "../api/rolesOrganizacionApi";
import { organizacionesKeys } from "./useOrganizacionesQuery";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

export function useCatalogoPermisosQuery(organizacionId: number) {
	return useQuery({
		queryKey: ["organizaciones", "catalogo-permisos"],
		queryFn: () => rolesOrganizacionApi.catalogo(organizacionId),
		// Es una constante del backend: no cambia mientras la app está abierta.
		staleTime: Number.POSITIVE_INFINITY,
	});
}

export function useRolesOrganizacionQuery(organizacionId: number) {
	return useQuery({
		queryKey: [...organizacionesKeys.detalle(organizacionId), "roles"],
		queryFn: () => rolesOrganizacionApi.obtenerTodos(organizacionId),
	});
}

/**
 * Cualquier cambio de roles puede cambiar mis permisos, los de los miembros y
 * el contador de cada rol: se refresca toda la organización.
 */
export function useGestionRoles(organizacionId: number) {
	const queryClient = useQueryClient();
	const refrescar = () =>
		queryClient.invalidateQueries({
			queryKey: organizacionesKeys.detalle(organizacionId),
		});

	return {
		guardar: useMutation({
			mutationFn: ({ id, datos }: { id?: number; datos: GuardarRolInput }) =>
				id
					? rolesOrganizacionApi.actualizar(organizacionId, id, datos)
					: rolesOrganizacionApi.crear(organizacionId, datos),
			onSuccess: () => {
				toast.success("Rol guardado");
				return refrescar();
			},
			onError,
		}),
		eliminar: useMutation({
			mutationFn: (id: number) =>
				rolesOrganizacionApi.eliminar(organizacionId, id),
			onSuccess: () => {
				toast.success("Rol eliminado");
				return refrescar();
			},
			onError,
		}),
		asignar: useMutation({
			mutationFn: ({
				usuarioId,
				rolIds,
			}: {
				usuarioId: number;
				rolIds: number[];
			}) => rolesOrganizacionApi.asignar(organizacionId, usuarioId, rolIds),
			onSuccess: () => {
				toast.success("Roles actualizados");
				return refrescar();
			},
			onError,
		}),
	};
}
