import { useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Input } from "@/core/components/ui/Input";
import { Select } from "@/core/components/ui/Select";
import { DialogoLectura } from "@/modules/adjuntos/components/DialogoLectura";
import { TagsBadges } from "@/modules/tags/components/TagsBadges";
import { useTagsDisponibles } from "@/modules/tags/hooks/useTagsDisponibles";
import type { NotaDto } from "../api/notasApi";
import { NotasTable } from "../components/NotasTable";
import { useEliminarNotaMutation } from "../hooks/useNotasMutation";
import { useNotasQuery } from "../hooks/useNotasQuery";

export function NotasPage() {
	const { puede } = usePermisos();
	const [pagina, setPagina] = useState(1);
	const [busqueda, setBusqueda] = useState("");
	const [tagId, setTagId] = useState("");
	const { tags } = useTagsDisponibles();
	const navigate = useNavigate();
	const editar = (nota: NotaDto) =>
		navigate({ to: "/notas/$id", params: { id: String(nota.id) } });
	const [leyendo, setLeyendo] = useState<NotaDto | null>(null);
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
					<Button onClick={() => navigate({ to: "/notas/nueva" })}>
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
				onAbrir={setLeyendo}
				onEditar={editar}
				onEliminar={setEliminando}
			/>

			<DialogoLectura
				abierto={leyendo !== null}
				onCerrar={() => setLeyendo(null)}
				titulo={leyendo?.titulo ?? ""}
				contenido={leyendo?.contenido ?? ""}
				detalles={
					leyendo &&
					leyendo.tagIds.length > 0 && <TagsBadges tagIds={leyendo.tagIds} />
				}
				onEditar={
					leyendo && puede("notas:actualizar")
						? () => editar(leyendo)
						: undefined
				}
			/>

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
