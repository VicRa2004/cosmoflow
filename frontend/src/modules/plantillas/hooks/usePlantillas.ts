import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import {
	type ActualizarPlantillaInput,
	type CrearPlantillaInput,
	plantillasApi,
} from "../api/plantillasApi";

const plantillasKey = (organizacionId?: number) =>
	["plantillas", organizacionId ?? "personales"] as const;
const onError = (error: unknown) => toast.error(getErrorMessage(error));

export function usePlantillasQuery(organizacionId?: number, enabled = true) {
	return useQuery({
		queryKey: plantillasKey(organizacionId),
		queryFn: () => plantillasApi.obtenerTodas(organizacionId),
		enabled,
	});
}

/**
 * Las personales y, en una tarea de organización, también las de esa organización.
 * Con `activo` en false no pide nada (al editar no se usan).
 */
export function usePlantillasDisponibles(
	organizacionId: number | undefined,
	activo: boolean,
) {
	const personales = usePlantillasQuery(undefined, activo);
	const deOrganizacion = usePlantillasQuery(
		organizacionId,
		activo && organizacionId !== undefined,
	);
	return {
		personales: personales.data,
		deOrganizacion: organizacionId === undefined ? [] : deOrganizacion.data,
	};
}

export function useCrearPlantillaMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			datos,
			organizacionId,
		}: {
			datos: CrearPlantillaInput;
			organizacionId?: number;
		}) => plantillasApi.crear(datos, organizacionId),
		onSuccess: (_, { organizacionId }) => {
			toast.success("Plantilla guardada");
			return queryClient.invalidateQueries({
				queryKey: plantillasKey(organizacionId),
			});
		},
		onError,
	});
}

export function useActualizarPlantillaMutation(organizacionId?: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			datos,
		}: {
			id: number;
			datos: ActualizarPlantillaInput;
		}) => plantillasApi.actualizar(id, datos, organizacionId),
		onSuccess: () => {
			toast.success("Plantilla actualizada");
			return queryClient.invalidateQueries({
				queryKey: plantillasKey(organizacionId),
			});
		},
		onError,
	});
}

export function useEliminarPlantillaMutation(organizacionId?: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => plantillasApi.eliminar(id, organizacionId),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: plantillasKey(organizacionId),
			}),
		onError,
	});
}
