import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { type ActualizarTagInput, tagsApi } from "../api/tagsApi";
import { tagsKeys } from "./useTagsQuery";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

function useInvalidar() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: tagsKeys.lists() });
}

export function useCrearTagMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: tagsApi.crear,
		onSuccess: () => {
			toast.success("Tag creado");
			return invalidar();
		},
		onError,
	});
}

export function useActualizarTagMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: ({ id, datos }: { id: number; datos: ActualizarTagInput }) =>
			tagsApi.actualizar(id, datos),
		onSuccess: () => {
			toast.success("Tag guardado");
			return invalidar();
		},
		onError,
	});
}

export function useEliminarTagMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: tagsApi.eliminar,
		onSuccess: () => {
			toast.success("Tag eliminado");
			return invalidar();
		},
		onError,
	});
}
