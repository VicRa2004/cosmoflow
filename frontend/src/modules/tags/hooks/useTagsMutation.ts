import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import {
	type ActualizarTagInput,
	type CrearTagInput,
	tagsApi,
} from "../api/tagsApi";
import { tagsKeys } from "./useTagsQuery";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

function useInvalidar() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: tagsKeys.lists() });
}

export function useCrearTagMutation(organizacionId?: number) {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: (datos: CrearTagInput) => tagsApi.crear(datos, organizacionId),
		onSuccess: () => {
			toast.success("Tag creado");
			return invalidar();
		},
		onError,
	});
}

export function useActualizarTagMutation(organizacionId?: number) {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: ({ id, datos }: { id: number; datos: ActualizarTagInput }) =>
			tagsApi.actualizar(id, datos, organizacionId),
		onSuccess: () => {
			toast.success("Tag guardado");
			return invalidar();
		},
		onError,
	});
}

export function useEliminarTagMutation(organizacionId?: number) {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: (id: number) => tagsApi.eliminar(id, organizacionId),
		onSuccess: () => {
			toast.success("Tag eliminado");
			return invalidar();
		},
		onError,
	});
}
