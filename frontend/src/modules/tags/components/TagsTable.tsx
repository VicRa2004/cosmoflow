import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import { type Columna, type Pagina, Tabla } from "@/core/components/ui/Table";
import type { TagDto } from "../api/tagsApi";

interface TagsTableProps {
	pagina?: Pagina<TagDto>;
	isLoading: boolean;
	error?: unknown;
	onCambioPagina: (pagina: number) => void;
	onEditar: (fila: TagDto) => void;
	onEliminar: (fila: TagDto) => void;
}

export function TagsTable({
	pagina,
	isLoading,
	error,
	onCambioPagina,
	onEditar,
	onEliminar,
}: TagsTableProps) {
	const columnas: Columna<TagDto>[] = [
		{
			cabecera: "ID",
			className: "font-mono text-xs text-tinta-tenue",
			celda: (fila) => `#${fila.id}`,
		},
		{
			cabecera: "Nombre",
			celda: (fila) => fila.nombre ?? "—",
		},
		{
			cabecera: <span className="sr-only">Acciones</span>,
			className: "text-right",
			celda: (fila) => (
				<div className="flex justify-end gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEditar(fila)}
						aria-label="Editar"
					>
						<Pencil className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEliminar(fila)}
						aria-label="Eliminar"
					>
						<Trash2 className="h-4 w-4 text-rose-400" />
					</Button>
				</div>
			),
		},
	];

	return (
		<Tabla
			etiqueta="Tags"
			columnas={columnas}
			datos={pagina}
			clave={(fila) => fila.id}
			onCambioPagina={onCambioPagina}
			isLoading={isLoading}
			error={error}
		/>
	);
}
