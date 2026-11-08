import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { Spinner } from "@/core/components/ui/Spinner";
import { PaginaLectura } from "@/modules/adjuntos/components/PaginaLectura";
import { TagsBadges } from "@/modules/tags/components/TagsBadges";
import { AccionesNota } from "../components/AccionesNota";
import { useNotaQuery } from "../hooks/useNotasQuery";

/** Lectura de una nota, para quien no tiene permiso de editarla. */
export function NotaLecturaPage({ id }: { id: number }) {
	const router = useRouter();
	const navigate = useNavigate();
	const puedeVolver = useCanGoBack();
	const { data: nota, error } = useNotaQuery(id);
	// Vuelve a donde se abrió; si se entró por URL, a la lista.
	const volver = () =>
		puedeVolver ? router.history.back() : navigate({ to: "/notas" });

	if (error) throw error;
	if (!nota) {
		return (
			<div className="flex justify-center py-16 text-tinta-tenue">
				<Spinner />
			</div>
		);
	}
	return (
		<PaginaLectura
			onVolver={volver}
			titulo={nota.titulo}
			contenido={nota.contenido}
			ambito={
				nota.organizacionId && nota.proyectoId
					? {
							organizacionId: nota.organizacionId,
							proyectoId: nota.proyectoId,
						}
					: undefined
			}
			detalles={
				nota.tagIds.length > 0 && (
					<TagsBadges
						tagIds={nota.tagIds}
						organizacionId={nota.organizacionId}
					/>
				)
			}
			acciones={<AccionesNota nota={nota} onEliminada={volver} />}
		/>
	);
}
