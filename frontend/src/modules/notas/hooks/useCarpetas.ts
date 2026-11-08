import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import {
	type ActualizarCarpetaInput,
	carpetasApi,
	notasApi,
} from "../api/notasApi";
import { notasKeys } from "./useNotasQuery";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

/** Bajo `notasKeys.all`: invalidar las notas refresca también las carpetas. */
const carpetasKeys = {
	lista: (proyectoId?: number) =>
		[...notasKeys.all, "carpetas", proyectoId ?? "personales"] as const,
};

/** Todas las carpetas del ámbito (el árbol se arma con `padreId`). */
export function useCarpetasQuery(proyectoId?: number) {
	return useQuery({
		queryKey: carpetasKeys.lista(proyectoId),
		queryFn: () => carpetasApi.obtenerTodas(proyectoId),
	});
}

function useInvalidar() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: notasKeys.all });
}

export function useCrearCarpetaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: carpetasApi.crear,
		onSuccess: () => {
			toast.success("Carpeta creada");
			return invalidar();
		},
		onError,
	});
}

export function useActualizarCarpetaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: ({
			id,
			datos,
		}: {
			id: number;
			datos: ActualizarCarpetaInput;
		}) => carpetasApi.actualizar(id, datos),
		onSuccess: () => {
			toast.success("Carpeta guardada");
			return invalidar();
		},
		onError,
	});
}

export function useEliminarCarpetaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: carpetasApi.eliminar,
		onSuccess: () => {
			toast.success(
				"Carpeta eliminada; su contenido pasó a la carpeta superior",
			);
			return invalidar();
		},
		onError,
	});
}

export function useImportarNotasMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: notasApi.importar,
		onSettled: invalidar,
		onError,
	});
}
