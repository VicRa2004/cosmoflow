import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Input } from "@/core/components/ui/Input";
import { Select } from "@/core/components/ui/Select";
import type { EstadoTarea, TareaDto } from "../api/tareasApi";
import { TareaDialog } from "../components/TareaDialog";
import { TareasTable } from "../components/TareasTable";
import { useEliminarTareaMutation } from "../hooks/useTareasMutation";
import { useTagsDisponibles } from "../hooks/useTagsDisponibles";
import { useTareasQuery } from "../hooks/useTareasQuery";
import { ETIQUETAS_ESTADO } from "../schemas/tareaSchemas";

export function TareasPage() {
	const [pagina, setPagina] = useState(1);
	const [busqueda, setBusqueda] = useState("");
	const [estado, setEstado] = useState<EstadoTarea | "">("");
	const [tagId, setTagId] = useState("");
	const { tags } = useTagsDisponibles();
	/** `null` = cerrado; `"nuevo"` = alta; un DTO = edición. */
	const [editando, setEditando] = useState<TareaDto | "nuevo" | null>(null);
	const [eliminando, setEliminando] = useState<TareaDto | null>(null);
	const eliminar = useEliminarTareaMutation();
	const { data, isLoading, error } = useTareasQuery({
		pagina,
		limite: 10,
		busqueda: busqueda.trim() || undefined,
		estado: estado || undefined,
		tagId: tagId ? Number(tagId) : undefined,
	});

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<h1 className="text-2xl font-bold tracking-tight text-tinta">Tareas</h1>
				<div className="flex flex-col gap-2 sm:flex-row">
					<div className="w-full sm:w-44">
						<Select
							aria-label="Filtrar por estado"
							value={estado}
							onChange={(e) => {
								setEstado(e.target.value as EstadoTarea | "");
								setPagina(1);
							}}
						>
							<option value="">Todos los estados</option>
							{Object.entries(ETIQUETAS_ESTADO).map(([valor, texto]) => (
								<option key={valor} value={valor}>
									{texto}
								</option>
							))}
						</Select>
					</div>
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
							aria-label="Buscar por título"
							placeholder="Buscar por título..."
							value={busqueda}
							onChange={(e) => {
								setBusqueda(e.target.value);
								setPagina(1);
							}}
							className="pl-9"
						/>
						<Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-tinta-tenue" />
					</div>
					<Button onClick={() => setEditando("nuevo")}>
						<Plus className="h-4 w-4" />
						Nueva
					</Button>
				</div>
			</div>

			<TareasTable
				pagina={data}
				isLoading={isLoading}
				error={error}
				onCambioPagina={setPagina}
				onEditar={setEditando}
				onEliminar={setEliminando}
			/>

			<TareaDialog editando={editando} onCerrar={() => setEditando(null)} />

			<ConfirmDialog
				abierto={eliminando !== null}
				titulo="¿Eliminar tarea?"
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
