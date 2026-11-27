import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { Spinner } from "@/core/components/ui/Spinner";
import { NotaForm } from "../components/NotaForm";
import { useNotaQuery } from "../hooks/useNotasQuery";
import type { ContextoNotaSearch } from "../schemas/notaSchemas";

/** Alta (sin `id`, en `contexto` si viene) o edición de una nota a página completa; abrir una nota editable es entrar aquí. */
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
	// Vuelve a donde se abrió; si se entró por URL, a la carpeta de la nota.
	const volver = () =>
		puedeVolver
			? router.history.back()
			: navigate({
					to: "/notas",
					search: data
						? {
								organizacionId: data.organizacionId ?? undefined,
								proyectoId: data.proyectoId ?? undefined,
								carpetaId: data.carpetaId ?? undefined,
							}
						: (contexto ?? {}),
				});

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
			// Recién creada, se sigue escribiendo en ella (ya con guardado automático).
			onGuardada={(nota) =>
				navigate({
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
