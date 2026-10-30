import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Spinner } from "@/core/components/ui/Spinner";
import { PaginaLectura } from "@/modules/adjuntos/components/PaginaLectura";
import { TagsBadges } from "@/modules/tags/components/TagsBadges";
import { useEliminarNotaMutation } from "../hooks/useNotasMutation";
import { useNotaQuery } from "../hooks/useNotasQuery";

/** Lectura de una nota: tags, contenido y las acciones que permita el usuario. */
export function NotaLecturaPage({ id }: { id: number }) {
	const router = useRouter();
	const navigate = useNavigate();
	const puedeVolver = useCanGoBack();
	const { puede } = usePermisos();
	const { data: nota, error } = useNotaQuery(id);
	const eliminar = useEliminarNotaMutation();
	const [eliminando, setEliminando] = useState(false);
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
		<>
			<PaginaLectura
				onVolver={volver}
				titulo={nota.titulo}
				contenido={nota.contenido}
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
						{puede("notas:eliminar") && (
							<Button
								variant="dangerGhost"
								size="sm"
								onClick={() => setEliminando(true)}
							>
								<Trash2 className="h-4 w-4" />
								Eliminar
							</Button>
						)}
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
			<ConfirmDialog
				abierto={eliminando}
				titulo="¿Eliminar nota?"
				mensaje="Esta acción no se puede deshacer."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setEliminando(false)}
				onConfirmar={() => eliminar.mutate(id, { onSuccess: volver })}
			/>
		</>
	);
}
