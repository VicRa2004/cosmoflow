import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { Spinner } from "@/core/components/ui/Spinner";
import { NotaForm } from "../components/NotaForm";
import { useNotaQuery } from "../hooks/useNotasQuery";
import type { ContextoNotaSearch } from "../schemas/notaSchemas";

/** Alta (sin `id`, en `contexto` si viene) o edición de una nota a página completa. */
export function NotaEditorPage({
	id,
	contexto,
}: {
	id?: number;
	contexto?: ContextoNotaSearch;
}) {
	const router = useRouter();
	const navigate = useNavigate();
	const puedeVolver = useCanGoBack();
	const { data, error } = useNotaQuery(id);
	// Vuelve a donde se abrió (lista o portada); si se entró por URL, a la lista.
	const volver = () =>
		puedeVolver ? router.history.back() : navigate({ to: "/notas" });

	if (error) throw error;
	if (id !== undefined && !data) {
		return (
			<div className="flex justify-center py-16 text-tinta-tenue">
				<Spinner />
			</div>
		);
	}
	return (
		<NotaForm
			key={id ?? "nueva"}
			inicial={data}
			contexto={contexto}
			onGuardado={volver}
			onVolver={volver}
		/>
	);
}
