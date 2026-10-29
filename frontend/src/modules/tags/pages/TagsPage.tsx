import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Dialog } from "@/core/components/ui/Dialog";
import { Input } from "@/core/components/ui/Input";
import type { TagDto } from "../api/tagsApi";
import { TagForm } from "../components/TagForm";
import { TagsTable } from "../components/TagsTable";
import { useEliminarTagMutation } from "../hooks/useTagsMutation";
import { useTagsQuery } from "../hooks/useTagsQuery";

export function TagsPage() {
	const { puede } = usePermisos();
	const [pagina, setPagina] = useState(1);
	const [busqueda, setBusqueda] = useState("");
	/** `null` = cerrado; `"nuevo"` = alta; un DTO = edición. */
	const [editando, setEditando] = useState<TagDto | "nuevo" | null>(null);
	const [eliminando, setEliminando] = useState<TagDto | null>(null);
	const eliminar = useEliminarTagMutation();
	const { data, isLoading, error } = useTagsQuery({
		pagina,
		limite: 10,
		nombre: busqueda.trim() || undefined,
	});

	return (
		<div className="space-y-6">
			<EncabezadoPagina titulo="Tags">
				<div className="relative w-full sm:w-64">
					<Input
						aria-label="Buscar por nombre"
						placeholder="Buscar por nombre..."
						value={busqueda}
						onChange={(e) => {
							setBusqueda(e.target.value);
							setPagina(1);
						}}
						className="pl-9"
					/>
					<Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-tinta-tenue" />
				</div>
				{puede("tags:crear") && (
					<Button onClick={() => setEditando("nuevo")}>
						<Plus className="h-4 w-4" />
						Nuevo
					</Button>
				)}
			</EncabezadoPagina>

			<TagsTable
				pagina={data}
				isLoading={isLoading}
				error={error}
				onCambioPagina={setPagina}
				onEditar={setEditando}
				onEliminar={setEliminando}
			/>

			<Dialog
				abierto={editando !== null}
				onCerrar={() => setEditando(null)}
				titulo={editando === "nuevo" ? "Nuevo tag" : "Editar tag"}
			>
				{editando !== null && (
					<TagForm
						key={editando === "nuevo" ? "nuevo" : editando.id}
						inicial={editando === "nuevo" ? undefined : editando}
						onGuardado={() => setEditando(null)}
					/>
				)}
			</Dialog>

			<ConfirmDialog
				abierto={eliminando !== null}
				titulo="¿Eliminar tag?"
				mensaje="Esta acción no se puede deshacer."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setEliminando(null)}
				onConfirmar={() =>
					eliminando &&
					eliminar.mutate(eliminando.id, {
						onSuccess: () => setEliminando(null),
					})
				}
			/>
		</div>
	);
}
