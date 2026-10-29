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
	const refrescar = () =>
		queryClient.invalidateQueries({ queryKey: equiposKey(organizacionId) });

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
