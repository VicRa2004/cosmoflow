import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import {
	AccionesFila,
	type Columna,
	type Pagina,
	Tabla,
} from "@/core/components/ui/Table";
import { TagsBadges } from "@/modules/tags/components/TagsBadges";
import type { NotaDto } from "../api/notasApi";

/** Primera línea con texto, sin la sintaxis markdown más común. */
const extracto = (markdown: string) =>
	(markdown.split("\n").find((l) => l.trim()) ?? "")
		.replace(/^\s*(#+|[-*+]|\d+\.|>|- \[[ x]\])\s*/, "")
		.replace(/[*_`~]/g, "");

const formatearFecha = (iso: string) =>
	new Date(iso).toLocaleDateString("es-ES", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

interface NotasTableProps {
	pagina?: Pagina<NotaDto>;
	isLoading: boolean;
	error?: unknown;
	onCambioPagina: (pagina: number) => void;
	/** Abre la lectura (contenido renderizado). */
	onAbrir: (fila: NotaDto) => void;
	onEditar: (fila: NotaDto) => void;
	onEliminar: (fila: NotaDto) => void;
}

export function NotasTable({
	pagina,
	isLoading,
	error,
	onCambioPagina,
	onAbrir,
	onEditar,
	onEliminar,
}: NotasTableProps) {
	const columnas: Columna<NotaDto>[] = [
		{
			cabecera: "Nota",
			celda: (fila) => (
				<div className="max-w-xl">
					<button
						type="button"
						onClick={() => onAbrir(fila)}
						className="text-left font-medium text-tinta hover:text-indigo-400 hover:underline"
					>
						{fila.titulo}
					</button>
					{fila.contenido && (
						<p className="truncate text-xs text-tinta-tenue">
							{extracto(fila.contenido)}
						</p>
					)}
				</div>
			),
		},
		{
			cabecera: "Tags",
			celda: (fila) => (
				<TagsBadges tagIds={fila.tagIds} organizacionId={fila.organizacionId} />
			),
		},
		{
			cabecera: "Editada",
			className: "whitespace-nowrap text-tinta-suave",
			celda: (fila) => formatearFecha(fila.updatedAt),
		},
		{
			cabecera: <span className="sr-only">Acciones</span>,
			className: "text-right",
			celda: (fila) => (
				<AccionesFila>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEditar(fila)}
						aria-label="Editar"
					>
						<Pencil className="h-4 w-4" />
					</Button>
					<Button
						variant="dangerGhost"
						size="sm"
						onClick={() => onEliminar(fila)}
						aria-label="Eliminar"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</AccionesFila>
			),
		},
	];

	return (
		<Tabla
			etiqueta="Notas"
			columnas={columnas}
			datos={pagina}
			clave={(fila) => fila.id}
			onCambioPagina={onCambioPagina}
			isLoading={isLoading}
			error={error}
		/>
	);
}
