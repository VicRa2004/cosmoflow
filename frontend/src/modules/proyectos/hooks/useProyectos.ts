import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { organizacionesKeys } from "@/modules/organizaciones/hooks/useOrganizacionesQuery";
import {
	type EstadoProyecto,
	type GuardarProyectoInput,
	proyectosApi,
} from "../api/proyectosApi";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

const proyectosKey = (organizacionId: number) =>
	[...organizacionesKeys.detalle(organizacionId), "proyectos"] as const;

export function useProyectosQuery(
	organizacionId: number,
	estado?: EstadoProyecto,
) {
	return useQuery({
		queryKey: [...proyectosKey(organizacionId), { estado }],
		queryFn: () => proyectosApi.obtenerTodos(organizacionId, { estado }),
	});
}

export function useGestionProyectos(organizacionId: number) {
	const queryClient = useQueryClient();
	const refrescar = () =>
		queryClient.invalidateQueries({ queryKey: proyectosKey(organizacionId) });

	return {
		guardar: useMutation({
			mutationFn: ({
				id,
				datos,
			}: {
				id?: number;
				datos: GuardarProyectoInput;
			}) =>
				id
					? proyectosApi.actualizar(organizacionId, id, datos)
					: proyectosApi.crear(organizacionId, datos),
			onSuccess: () => {
				toast.success("Proyecto guardado");
				return refrescar();
			},
			onError,
		}),
		eliminar: useMutation({
			mutationFn: (id: number) => proyectosApi.eliminar(organizacionId, id),
			onSuccess: () => {
				toast.success("Proyecto eliminado");
				return refrescar();
			},
			onError,
		}),
	};
}
