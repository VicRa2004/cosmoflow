import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { Spinner } from "@/core/components/ui/Spinner";
import { TareaForm } from "../components/TareaForm";
import { useTareaQuery } from "../hooks/useTareasQuery";

/** Alta (sin `id`) o edición de una tarea a página completa. */
export function TareaEditorPage({ id }: { id?: number }) {
	const router = useRouter();
	const navigate = useNavigate();
	const puedeVolver = useCanGoBack();
	const { data, error } = useTareaQuery(id);
	// Vuelve a donde se abrió (lista o portada); si se entró por URL, a la lista.
	const volver = () =>
		puedeVolver ? router.history.back() : navigate({ to: "/tareas" });

	if (error) throw error;
	if (id !== undefined && !data) {
		return (
			<div className="flex justify-center py-16 text-tinta-tenue">
				<Spinner />
			</div>
		);
	}
	return (
		<TareaForm
			key={id ?? "nueva"}
			inicial={data}
			onGuardado={volver}
			onVolver={volver}
		/>
	);
}
