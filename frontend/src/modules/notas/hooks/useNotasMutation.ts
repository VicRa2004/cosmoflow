import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { type ActualizarNotaInput, notasApi } from "../api/notasApi";
import { notasKeys } from "./useNotasQuery";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

function useInvalidar() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: notasKeys.all });
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

/** Arrastrar una nota a otra carpeta (`null`: la raíz). */
export function useMoverNotaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: ({ id, carpetaId }: { id: number; carpetaId: number | null }) =>
			notasApi.actualizar(id, { carpetaId }),
		onSuccess: invalidar,
		onError,
	});
}

export function useDuplicarNotaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: notasApi.duplicar,
		onSuccess: () => {
			toast.success("Nota duplicada");
			return invalidar();
		},
		onError,
	});
}

export function useFijarNotaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: ({ id, isFijada }: { id: number; isFijada: boolean }) =>
			notasApi.actualizar(id, { isFijada }),
		onSuccess: (_data, { isFijada }) => {
			toast.success(isFijada ? "Nota fijada" : "Nota desfijada");
			return invalidar();
		},
		onError,
	});
}
