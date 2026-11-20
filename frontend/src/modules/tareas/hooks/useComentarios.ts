import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { comentariosApi } from "../api/comentariosApi";
import { tareasKeys } from "./useTareasQuery";

const clave = (tareaId: number) =>
	[...tareasKeys.detalle(tareaId), "comentarios"] as const;
const onError = (error: unknown) => toast.error(getErrorMessage(error));

export function useComentariosQuery(tareaId: number) {
	return useQuery({
		queryKey: clave(tareaId),
		queryFn: () => comentariosApi.obtenerTodos(tareaId),
	});
}

/** Historial por páginas; los eventos llegan a la auditoría en segundos (outbox). */
export function useActividadQuery(tareaId: number) {
	return useInfiniteQuery({
		queryKey: [...tareasKeys.detalle(tareaId), "actividad"],
		queryFn: ({ pageParam }) => comentariosApi.actividad(tareaId, pageParam),
		initialPageParam: undefined as number | undefined,
		getNextPageParam: (ultima) =>
			ultima.hayMas ? ultima.datos.at(-1)?.id : undefined,
	});
}

/** Comentar, editar y eliminar; todas refrescan la conversación de la tarea. */
export function useComentariosMutation(tareaId: number) {
	const queryClient = useQueryClient();
	const invalidar = () =>
		queryClient.invalidateQueries({ queryKey: clave(tareaId) });

	return {
		crear: useMutation({
			mutationFn: (contenido: string) =>
				comentariosApi.crear(tareaId, contenido),
			onSuccess: invalidar,
			onError,
		}),
		actualizar: useMutation({
			mutationFn: ({ id, contenido }: { id: number; contenido: string }) =>
				comentariosApi.actualizar(tareaId, id, contenido),
			onSuccess: invalidar,
			onError,
		}),
		eliminar: useMutation({
			mutationFn: (id: number) => comentariosApi.eliminar(tareaId, id),
			onSuccess: () => {
				toast.success("Comentario eliminado");
				return invalidar();
			},
			onError,
		}),
	};
}
