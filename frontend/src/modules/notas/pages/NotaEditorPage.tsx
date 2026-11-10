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
	// Vuelve a donde se abrió; si se entró por URL, a su lectura (o a la carpeta si es nueva).
	const volver = () =>
		puedeVolver
			? router.history.back()
			: id === undefined
				? navigate({ to: "/notas", search: contexto ?? {} })
				: navigate({ to: "/notas/$id", params: { id: String(id) } });

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
			// Ya en /notas/nueva, crear en otra carpeta debe reiniciar el formulario.
			key={id ?? `nueva-${contexto?.carpetaId ?? ""}`}
			inicial={data}
			contexto={contexto}
			onVolver={volver}
			onGuardada={(nota) =>
				id !== undefined
					? volver()
					: navigate({
							to: "/notas/$id",
							params: { id: String(nota.id) },
							search: {
								organizacionId: nota.organizacionId ?? undefined,
								proyectoId: nota.proyectoId ?? undefined,
							},
							replace: true,
						})
			}
		/>
	);
}
