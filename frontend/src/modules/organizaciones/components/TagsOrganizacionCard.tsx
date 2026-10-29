import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/core/components/ui/Badge";
import { Button } from "@/core/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Dialog } from "@/core/components/ui/Dialog";
import type { TagDto } from "@/modules/tags/api/tagsApi";
import { TagForm } from "@/modules/tags/components/TagForm";
import { useEliminarTagMutation } from "@/modules/tags/hooks/useTagsMutation";
import { useTagsQuery } from "@/modules/tags/hooks/useTagsQuery";

// shortcut: solo los 100 primeros tags (por nombre); paginar si una organización tiene más.
const LIMITE = 100;

/** Tags de la organización (RN-60): los ven todos; con `tags:gestionar` se editan. */
export function TagsOrganizacionCard({
	organizacionId,
	puedeGestionar,
}: {
	organizacionId: number;
	puedeGestionar: boolean;
}) {
	const { data } = useTagsQuery({ pagina: 1, limite: LIMITE }, organizacionId);
	const eliminar = useEliminarTagMutation(organizacionId);
	/** `null` = cerrado; `"nuevo"` = alta; un DTO = edición. */
	const [editando, setEditando] = useState<TagDto | "nuevo" | null>(null);
	const [borrando, setBorrando] = useState<TagDto | null>(null);
	const tags = data?.datos;

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div>
					<CardTitle>Tags</CardTitle>
					<CardDescription>
						Compartidos por toda la organización.
					</CardDescription>
				</div>
				{puedeGestionar && (
					<Button size="sm" onClick={() => setEditando("nuevo")}>
						<Plus className="h-4 w-4" />
						Nuevo tag
					</Button>
				)}
			</CardHeader>
			<CardContent>
				{tags && tags.length === 0 ? (
					<p className="text-sm text-tinta-tenue">Aún no hay tags.</p>
				) : (
					<ul className="flex flex-wrap gap-2">
						{tags?.map((tag) => (
							<li key={tag.id} className="flex items-center gap-1">
								<Badge>{tag.nombre}</Badge>
								{puedeGestionar && (
									<>
										<Button
											variant="ghost"
											size="sm"
											aria-label={`Editar el tag ${tag.nombre}`}
											title="Editar"
											onClick={() => setEditando(tag)}
										>
											<Pencil className="h-3.5 w-3.5" />
										</Button>
										<Button
											variant="dangerGhost"
											size="sm"
											aria-label={`Eliminar el tag ${tag.nombre}`}
											title="Eliminar"
											onClick={() => setBorrando(tag)}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</Button>
									</>
								)}
							</li>
						))}
					</ul>
				)}
			</CardContent>

			<Dialog
				abierto={editando !== null}
				onCerrar={() => setEditando(null)}
				titulo={editando === "nuevo" ? "Nuevo tag" : "Editar tag"}
			>
				{editando !== null && (
					<TagForm
						key={editando === "nuevo" ? "nuevo" : editando.id}
						organizacionId={organizacionId}
						inicial={editando === "nuevo" ? undefined : editando}
						onGuardado={() => setEditando(null)}
					/>
				)}
			</Dialog>

			<ConfirmDialog
				abierto={borrando !== null}
				titulo={`¿Eliminar el tag «${borrando?.nombre ?? ""}»?`}
				mensaje="Esta acción no se puede deshacer."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setBorrando(null)}
				onConfirmar={() =>
					borrando &&
					eliminar.mutate(borrando.id, { onSuccess: () => setBorrando(null) })
				}
			/>
		</Card>
	);
}
