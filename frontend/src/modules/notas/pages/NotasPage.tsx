import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Dialog } from "@/core/components/ui/Dialog";
import { Input } from "@/core/components/ui/Input";
import { Select } from "@/core/components/ui/Select";
import { useTagsDisponibles } from "@/modules/tags/hooks/useTagsDisponibles";
import type { NotaDto } from "../api/notasApi";
import { NotaForm } from "../components/NotaForm";
import { NotasTable } from "../components/NotasTable";
import { useEliminarNotaMutation } from "../hooks/useNotasMutation";
import { useNotasQuery } from "../hooks/useNotasQuery";

export function NotasPage() {
	const { puede } = usePermisos();
	const [pagina, setPagina] = useState(1);
	const [busqueda, setBusqueda] = useState("");
	const [tagId, setTagId] = useState("");
	const { tags } = useTagsDisponibles();
	/** `null` = cerrado; `"nuevo"` = alta; un DTO = edición. */
	const [editando, setEditando] = useState<NotaDto | "nuevo" | null>(null);
	const [eliminando, setEliminando] = useState<NotaDto | null>(null);
	const eliminar = useEliminarNotaMutation();
	const { data, isLoading, error } = useNotasQuery({
		pagina,
		limite: 10,
		busqueda: busqueda.trim() || undefined,
		tagId: tagId ? Number(tagId) : undefined,
	});

	return (
		<div className="space-y-6">
			<EncabezadoPagina titulo="Notas">
				{tags.length > 0 && (
					<div className="w-full sm:w-40">
						<Select
							aria-label="Filtrar por tag"
							value={tagId}
							onChange={(e) => {
								setTagId(e.target.value);
								setPagina(1);
							}}
						>
							<option value="">Todos los tags</option>
							{tags.map((tag) => (
								<option key={tag.id} value={tag.id}>
									{tag.nombre}
								</option>
							))}
						</Select>
					</div>
				)}
				<div className="relative w-full sm:w-64">
					<Input
						aria-label="Buscar en título y contenido"
						placeholder="Buscar en las notas..."
						value={busqueda}
						onChange={(e) => {
							setBusqueda(e.target.value);
							setPagina(1);
						}}
						className="pl-9"
					/>
					<Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-tinta-tenue" />
				</div>
				{puede("notas:crear") && (
					<Button onClick={() => setEditando("nuevo")}>
						<Plus className="h-4 w-4" />
						Nueva
					</Button>
				)}
			</EncabezadoPagina>

			<NotasTable
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
				titulo={editando === "nuevo" ? "Nueva nota" : "Editar nota"}
			>
				{editando !== null && (
					<NotaForm
						key={editando === "nuevo" ? "nuevo" : editando.id}
						inicial={editando === "nuevo" ? undefined : editando}
						onGuardado={() => setEditando(null)}
					/>
				)}
			</Dialog>

			<ConfirmDialog
				abierto={eliminando !== null}
				titulo="¿Eliminar nota?"
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
