import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { notasKeys } from "@/modules/notas/hooks/useNotasQuery";
import { tareasKeys } from "@/modules/tareas/hooks/useTareasQuery";
import { papeleraApi, type TipoPapelera } from "../api/papeleraApi";

// Bajo las claves de cada módulo: borrar una tarea o nota también refresca su papelera.
const claves = {
	tareas: (pagina: number) => [...tareasKeys.all, "papelera", pagina] as const,
	notas: (pagina: number) => [...notasKeys.all, "papelera", pagina] as const,
};

export function usePapeleraTareasQuery(pagina: number) {
	return useQuery({
		queryKey: claves.tareas(pagina),
		queryFn: () => papeleraApi.tareas(pagina),
		placeholderData: keepPreviousData,
	});
}

export function usePapeleraNotasQuery(pagina: number) {
	return useQuery({
		queryKey: claves.notas(pagina),
		queryFn: () => papeleraApi.notas(pagina),
		placeholderData: keepPreviousData,
	});
}

/** Restaurar o borrar del todo; refresca las listas del módulo (también la papelera). */
export function usePapeleraMutation(tipo: TipoPapelera) {
	const queryClient = useQueryClient();
	const invalidar = () =>
		queryClient.invalidateQueries({
			queryKey: tipo === "tareas" ? tareasKeys.all : notasKeys.all,
		});
	const onError = (error: unknown) => toast.error(getErrorMessage(error));
	const nombre = tipo === "tareas" ? "Tarea" : "Nota";

	const restaurar = useMutation({
		mutationFn: (id: number) => papeleraApi.restaurar(tipo, id),
		onSuccess: () => {
			toast.success(`${nombre} restaurada`);
			return invalidar();
		},
		onError,
	});
	const eliminar = useMutation({
		mutationFn: (id: number) => papeleraApi.eliminar(tipo, id),
		onSuccess: () => {
			toast.success(`${nombre} borrada definitivamente`);
			return invalidar();
		},
		onError,
	});
	return { restaurar, eliminar };
}
