import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { type ActualizarTareaInput, tareasApi } from "../api/tareasApi";
import { tareasKeys } from "./useTareasQuery";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

function useInvalidar() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: tareasKeys.all });
}

export function useCrearTareaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: tareasApi.crear,
		onSuccess: () => {
			toast.success("Tarea creada");
			return invalidar();
		},
		onError,
	});
}

export function useActualizarTareaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: ({ id, datos }: { id: number; datos: ActualizarTareaInput }) =>
			tareasApi.actualizar(id, datos),
		onSuccess: () => {
			toast.success("Tarea guardada");
			return invalidar();
		},
		onError,
	});
}

export function useEliminarTareaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: tareasApi.eliminar,
		onSuccess: () => {
			toast.success("Tarea eliminada");
			return invalidar();
		},
		onError,
	});
}
