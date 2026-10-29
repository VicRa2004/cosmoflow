import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import {
	AccionesFila,
	type Columna,
	type Pagina,
	Tabla,
} from "@/core/components/ui/Table";
import { Badge, type BadgeProps } from "@/core/components/ui/Badge";
import type { EstadoTarea, TareaDto } from "../api/tareasApi";
import { ETIQUETAS_ESTADO, ETIQUETAS_PRIORIDAD } from "../schemas/tareaSchemas";
import { TagsBadges } from "@/modules/tags/components/TagsBadges";
import { VencimientoTarea } from "./celdas";

const VARIANTE_ESTADO: Record<EstadoTarea, BadgeProps["variant"]> = {
	pendiente: "default",
	en_progreso: "purple",
	completada: "success",
	cancelada: "warning",
};

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
			celda: (fila) => <VencimientoTarea tarea={fila} />,
		},
		{
			cabecera: "Tags",
			celda: (fila) => <TagsBadges tagIds={fila.tagIds} />,
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
