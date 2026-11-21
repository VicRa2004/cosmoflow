import { PuntoColor } from "@/core/components/ui/PuntoColor";
import { Copy, Pencil, Pin, Trash2 } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import {
	AccionesFila,
	type Columna,
	type Pagina,
	Tabla,
} from "@/core/components/ui/Table";
import type { TareaDto } from "../api/tareasApi";
import { TagsBadges } from "@/modules/tags/components/TagsBadges";
import {
	AccionAsignar,
	BloqueadaIcono,
	DondeTarea,
	EstadoBadge,
	esCompartida,
	InicioTarea,
	PrioridadBadge,
	ProgresoSubtareas,
	RecurrenciaIcono,
	ResponsablesTarea,
	VencimientoTarea,
} from "./celdas";
import { BotonCompletar } from "./BotonCompletar";

interface TareasTableProps {
	pagina?: Pagina<TareaDto>;
	isLoading: boolean;
	error?: unknown;
	onCambioPagina: (pagina: number) => void;
	/** Abre la lectura (contenido renderizado). */
	onAbrir: (fila: TareaDto) => void;
	onEditar: (fila: TareaDto) => void;
	onEliminar: (fila: TareaDto) => void;
	onDuplicar?: (fila: TareaDto) => void;
	onFijar?: (fila: TareaDto) => void;
	seleccionadas?: Set<number>;
	onToggleSeleccion?: (id: number) => void;
	onToggleTodas?: (ids: number[], seleccionar: boolean) => void;
	/** Columna «Responsables» y acción «Asignar» (tareas compartidas). */
	onAsignar?: (fila: TareaDto & { organizacionId: number }) => void;
	/** Columna «Dónde», para listas que mezclan contextos. */
	mostrarDonde?: boolean;
}

export function TareasTable({
	pagina,
	isLoading,
	error,
	onCambioPagina,
	onAbrir,
	onEditar,
	onEliminar,
	onDuplicar,
	onFijar,
	seleccionadas,
	onToggleSeleccion,
	onToggleTodas,
	onAsignar,
	mostrarDonde = false,
}: TareasTableProps) {
	const filasVisibles = pagina?.datos ?? [];
	const idsVisibles = filasVisibles.map((f) => f.id);
	const todasSeleccionadas =
		!!seleccionadas &&
		idsVisibles.length > 0 &&
		idsVisibles.every((id) => seleccionadas.has(id));

	const columnas: Columna<TareaDto>[] = [
		...(seleccionadas && onToggleSeleccion && onToggleTodas
			? [
					{
						cabecera: (
							<input
								type="checkbox"
								aria-label="Seleccionar todas las tareas visibles"
								checked={todasSeleccionadas}
								onChange={(e) => onToggleTodas(idsVisibles, e.target.checked)}
								className="h-4 w-4 cursor-pointer accent-indigo-500"
							/>
						),
						className: "w-10 pr-0",
						celda: (fila: TareaDto) => (
							<input
								type="checkbox"
								aria-label={`Seleccionar «${fila.titulo}»`}
								checked={seleccionadas.has(fila.id)}
								onChange={() => onToggleSeleccion(fila.id)}
								className="h-4 w-4 cursor-pointer accent-indigo-500"
							/>
						),
					},
				]
			: []),
		{
			cabecera: "Título",
			celda: (fila) => (
				<button
					type="button"
					onClick={() => onAbrir(fila)}
					className="flex items-center gap-2 text-left font-medium text-tinta hover:text-indigo-400 hover:underline"
				>
					<PuntoColor color={fila.color} />
					{fila.isFijada && (
						<Pin
							aria-label="Fijada"
							className="h-3.5 w-3.5 shrink-0 text-indigo-400"
						/>
					)}
					{fila.titulo}
					<BloqueadaIcono tarea={fila} />
					<RecurrenciaIcono tarea={fila} />
					<ProgresoSubtareas tarea={fila} />
				</button>
			),
		},
		...(mostrarDonde
			? [
					{
						cabecera: "Dónde",
						celda: (fila: TareaDto) =>
							esCompartida(fila) && <DondeTarea tarea={fila} />,
					},
				]
			: []),
		{
			cabecera: "Estado",
			celda: (fila) => <EstadoBadge estado={fila.estado} />,
		},
		{
			cabecera: "Prioridad",
			celda: (fila) => <PrioridadBadge prioridad={fila.prioridad} />,
		},
		{
			cabecera: "Inicio",
			celda: (fila) => <InicioTarea tarea={fila} />,
		},
		{
			cabecera: "Vence",
			celda: (fila) => <VencimientoTarea tarea={fila} />,
		},
		...(onAsignar
			? [
					{
						cabecera: "Responsables",
						celda: (fila: TareaDto) =>
							esCompartida(fila) && <ResponsablesTarea tarea={fila} />,
					},
				]
			: []),
		{
			cabecera: "Tags",
			celda: (fila) => (
				<TagsBadges tagIds={fila.tagIds} organizacionId={fila.organizacionId} />
			),
		},
		{
			cabecera: <span className="sr-only">Acciones</span>,
			className: "text-right",
			celda: (fila) => (
				<AccionesFila>
					{onFijar && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onFijar(fila)}
							aria-label={fila.isFijada ? "Desfijar" : "Fijar"}
							title={fila.isFijada ? "Desfijar" : "Fijar"}
						>
							<Pin
								className={
									fila.isFijada ? "h-4 w-4 text-indigo-400" : "h-4 w-4"
								}
							/>
						</Button>
					)}
					{onDuplicar && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onDuplicar(fila)}
							aria-label="Duplicar"
							title="Duplicar"
						>
							<Copy className="h-4 w-4" />
						</Button>
					)}
					{onAsignar && esCompartida(fila) && (
						<AccionAsignar tarea={fila} onAsignar={onAsignar} />
					)}
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
		{
			cabecera: <span className="sr-only">Acción</span>,
			className: "text-right",
			celda: (fila) => <BotonCompletar tarea={fila} />,
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
