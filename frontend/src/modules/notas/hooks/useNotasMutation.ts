import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { type ActualizarNotaInput, notasApi } from "../api/notasApi";
import { notasKeys } from "./useNotasQuery";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

function useInvalidar() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: notasKeys.lists() });
}

export function useCrearNotaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: notasApi.crear,
		onSuccess: () => {
			toast.success("Nota creada");
			return invalidar();
		},
		onError,
	});
}

export function useActualizarNotaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: ({ id, datos }: { id: number; datos: ActualizarNotaInput }) =>
			notasApi.actualizar(id, datos),
		onSuccess: () => {
			toast.success("Nota guardada");
			return invalidar();
		},
		onError,
	});
}

export function useEliminarNotaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: notasApi.eliminar,
		onSuccess: () => {
			toast.success("Nota eliminada");
			return invalidar();
		},
		onError,
	});
}
