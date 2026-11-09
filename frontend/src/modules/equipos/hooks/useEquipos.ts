import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { organizacionesKeys } from "@/modules/organizaciones/hooks/useOrganizacionesQuery";
import { type CrearEquipoInput, equiposApi } from "../api/equiposApi";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

const equiposKey = (organizacionId: number) =>
	[...organizacionesKeys.detalle(organizacionId), "equipos"] as const;

export function useEquiposQuery(organizacionId: number, tagId?: number) {
	return useQuery({
		queryKey: [...equiposKey(organizacionId), { tagId }],
		queryFn: () => equiposApi.obtenerTodos(organizacionId, { tagId }),
	});
}

export function useGestionEquipos(organizacionId: number) {
	const queryClient = useQueryClient();
	// También cambian los proyectos (equipos que muestran): se refresca la organización.
	const refrescar = () =>
		queryClient.invalidateQueries({
			queryKey: organizacionesKeys.detalle(organizacionId),
		});

	return {
		guardar: useMutation({
			mutationFn: ({ id, datos }: { id?: number; datos: CrearEquipoInput }) =>
				id
					? equiposApi.actualizar(organizacionId, id, datos)
					: equiposApi.crear(organizacionId, datos),
			onSuccess: () => {
				toast.success("Equipo guardado");
				return refrescar();
			},
			onError,
		}),
		delegados: useMutation({
			mutationFn: ({ id, usuarioIds }: { id: number; usuarioIds: number[] }) =>
				equiposApi.delegados(organizacionId, id, usuarioIds),
			onSuccess: () => {
				toast.success("Delegados guardados");
				return refrescar();
			},
			onError,
		}),
		eliminar: useMutation({
			mutationFn: (id: number) => equiposApi.eliminar(organizacionId, id),
			onSuccess: () => {
				toast.success("Equipo eliminado");
				return refrescar();
			},
			onError,
		}),
	};
}

/** Sube (con archivo) o quita (con `null`) la foto del equipo. */
export function useAvatarEquipoMutation(organizacionId: number, id: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (archivo: File | null) =>
			archivo
				? equiposApi.subirAvatar(organizacionId, id, archivo)
				: equiposApi.eliminarAvatar(organizacionId, id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: equiposKey(organizacionId) }),
		onError,
	});
}
