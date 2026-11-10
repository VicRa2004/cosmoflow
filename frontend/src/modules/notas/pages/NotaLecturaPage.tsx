import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { Spinner } from "@/core/components/ui/Spinner";
import { PaginaLectura } from "@/modules/adjuntos/components/PaginaLectura";
import { TagsBadges } from "@/modules/tags/components/TagsBadges";
import { AccionesNota } from "../components/AccionesNota";
import { useNotaQuery } from "../hooks/useNotasQuery";

/** Lectura de una nota a página completa; «Editar» lleva al editor. */
export function NotaLecturaPage({ id }: { id: number }) {
	const router = useRouter();
	const navigate = useNavigate();
	const puedeVolver = useCanGoBack();
	const { puede } = usePermisos();
	const { data: nota, error } = useNotaQuery(id);
	// Vuelve a donde se abrió; si se entró por URL, a la carpeta de la nota.
	const volver = () =>
		puedeVolver
			? router.history.back()
			: navigate({
					to: "/notas",
					search: {
						organizacionId: nota?.organizacionId ?? undefined,
						proyectoId: nota?.proyectoId ?? undefined,
						carpetaId: nota?.carpetaId ?? undefined,
					},
				});

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
			acciones={
				<>
					<AccionesNota nota={nota} onEliminada={volver} />
					{puede("notas:actualizar") && (
						<Button
							size="sm"
							onClick={() =>
								navigate({
									to: "/notas/$id/editar",
									params: { id: String(id) },
								})
							}
						>
							<Pencil className="h-4 w-4" />
							Editar
						</Button>
					)}
				</>
			}
		/>
	);
}
