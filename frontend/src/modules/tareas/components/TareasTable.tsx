import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import { type Columna, type Pagina, Tabla } from "@/core/components/ui/Table";
import { Badge, type BadgeProps } from "@/core/components/ui/Badge";
import type { EstadoTarea, TareaDto } from "../api/tareasApi";
import { useTagsDisponibles } from "../hooks/useTagsDisponibles";
import { ETIQUETAS_ESTADO, ETIQUETAS_PRIORIDAD } from "../schemas/tareaSchemas";

const VARIANTE_ESTADO: Record<EstadoTarea, BadgeProps["variant"]> = {
	pendiente: "default",
	en_progreso: "purple",
	completada: "success",
	cancelada: "warning",
};

/** "2026-11-15" → "15 nov 2026" (sin pasar por la zona horaria). */
const formatearDia = (dia: string) =>
	new Date(`${dia}T00:00`).toLocaleDateString("es-ES", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

interface TareasTableProps {
	pagina?: Pagina<TareaDto>;
	isLoading: boolean;
	error?: unknown;
	onCambioPagina: (pagina: number) => void;
	onEditar: (fila: TareaDto) => void;
	onEliminar: (fila: TareaDto) => void;
}

export function TareasTable({
	pagina,
	isLoading,
	error,
	onCambioPagina,
	onEditar,
	onEliminar,
}: TareasTableProps) {
	const { nombre } = useTagsDisponibles();
	const hoy = new Date().toLocaleDateString("sv-SE"); // AAAA-MM-DD local

	const columnas: Columna<TareaDto>[] = [
		{
			cabecera: "Título",
			className: "font-medium text-tinta",
			celda: (fila) => fila.titulo,
		},
		{
			cabecera: "Estado",
			celda: (fila) => (
				<Badge variant={VARIANTE_ESTADO[fila.estado]}>
					{ETIQUETAS_ESTADO[fila.estado]}
				</Badge>
			),
		},
		{
			cabecera: "Prioridad",
			celda: (fila) => ETIQUETAS_PRIORIDAD[fila.prioridad],
		},
		{
			cabecera: "Vence",
			celda: (fila) => {
				if (!fila.fechaVencimiento) return "—";
				const vencida =
					fila.fechaVencimiento < hoy &&
					(fila.estado === "pendiente" || fila.estado === "en_progreso");
				return (
					<span className={vencida ? "font-medium text-rose-400" : undefined}>
						{formatearDia(fila.fechaVencimiento)}
						{vencida && " · vencida"}
					</span>
				);
			},
		},
		{
			cabecera: "Tags",
			celda: (fila) => (
				<div className="flex flex-wrap gap-1">
					{fila.tagIds.map((id) => (
						<Badge key={id}>{nombre.get(id) ?? "…"}</Badge>
					))}
				</div>
			),
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
			etiqueta="Tareas"
			columnas={columnas}
			datos={pagina}
			clave={(fila) => fila.id}
			onCambioPagina={onCambioPagina}
			isLoading={isLoading}
			error={error}
		/>
	);
}
