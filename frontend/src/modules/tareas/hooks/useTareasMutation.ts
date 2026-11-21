import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import {
	type AccionLoteTareasInput,
	type ActualizarTareaInput,
	type DestinoTarea,
	tareasApi,
} from "../api/tareasApi";
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

export function useMoverTareaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: ({ id, destino }: { id: number; destino: DestinoTarea }) =>
			tareasApi.mover(id, destino),
		onSuccess: () => {
			toast.success("Tarea movida");
			return invalidar();
		},
		onError,
	});
}

export function useDuplicarTareaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: tareasApi.duplicar,
		onSuccess: () => {
			toast.success("Tarea duplicada");
			return invalidar();
		},
		onError,
	});
}

export function useFijarTareaMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: ({ id, isFijada }: { id: number; isFijada: boolean }) =>
			tareasApi.actualizar(id, { isFijada }),
		onSuccess: (_data, { isFijada }) => {
			toast.success(isFijada ? "Tarea fijada" : "Tarea desfijada");
			return invalidar();
		},
		onError,
	});
}

export function useAccionLoteTareasMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: (datos: AccionLoteTareasInput) => tareasApi.accionLote(datos),
		onSuccess: ({ afectadas }) => {
			toast.success(
				afectadas === 1
					? "1 tarea actualizada"
					: `${afectadas} tareas actualizadas`,
			);
			return invalidar();
		},
		onError,
	});
}

export function useEliminarLoteTareasMutation() {
	const invalidar = useInvalidar();
	return useMutation({
		mutationFn: (ids: number[]) => tareasApi.eliminarLote(ids),
		onSuccess: ({ afectadas }) => {
			toast.success(
				afectadas === 1
					? "1 tarea movida a la papelera"
					: `${afectadas} tareas movidas a la papelera`,
			);
			return invalidar();
		},
		onError,
	});
}
