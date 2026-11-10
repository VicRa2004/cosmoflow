import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import {
	type ActualizarNotaInput,
	type NotaIndiceDto,
	notasApi,
} from "../api/notasApi";
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

/**
 * Autoguardado: sin avisos y actualizando la caché a mano, para no volver a pedir la
 * bóveda en cada pausa al escribir. `scope`: los guardados van en orden, de uno en uno.
 */
export function useAutoguardarNotaMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, datos }: { id: number; datos: ActualizarNotaInput }) =>
			notasApi.actualizar(id, datos),
		scope: { id: "autoguardado-notas" },
		onSuccess: (nota) => {
			queryClient.setQueryData(notasKeys.detalle(nota.id), nota);
			const { id, titulo, color, carpetaId } = nota;
			queryClient.setQueriesData<NotaIndiceDto[]>(
				{ queryKey: notasKeys.explorador() },
				(notas) =>
					notas?.map((n) =>
						n.id === id ? { id, titulo, color, carpetaId } : n,
					),
			);
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
