import { Link } from "@tanstack/react-router";
import {
	ChevronRight,
	Download,
	FilePlus,
	FileText,
	FolderPlus,
	Pencil,
	Trash2,
} from "lucide-react";
import { type DragEvent, type MouseEvent, useCallback, useState } from "react";
import { PuntoColor } from "@/core/components/ui/PuntoColor";
import { cn } from "@/core/utils/cn";
import type { CarpetaDto, NotaIndiceDto } from "../api/notasApi";
import type { ContextoNotaSearch } from "../schemas/notaSchemas";
import { filasExplorador, subarbol } from "../utils/arbolCarpetas";
import { IconoCarpeta } from "./IconoCarpeta";
import {
	type MenuAbierto,
	MenuContextual,
	type OpcionMenu,
} from "./MenuContextual";

/** Lo que se arrastra: una nota o una carpeta. */
export interface Arrastrado {
	tipo: "nota" | "carpeta";
	id: number;
}

interface ArbolCarpetasProps {
	carpetas: CarpetaDto[];
	notas: NotaIndiceDto[];
	notaAbierta?: number;
	searchNota: ContextoNotaSearch;
	/** Donde se crean las notas nuevas; sin ella, en la raíz. */
	seleccionada?: number;
	onSeleccionar: (carpetaId?: number) => void;
	/** Sin menú de edición ni arrastre si no hay permiso. */
	editable: boolean;
	onNuevaNota: (carpetaId: number | null) => void;
	onNueva: (padreId: number | null) => void;
	onEditar: (carpeta: CarpetaDto) => void;
	onEliminar: (carpeta: CarpetaDto) => void;
	/** `null`: todas las notas del ámbito. */
	onDescargar: (carpeta: CarpetaDto | null) => void;
	/** Soltar en `destino` (`null`: la raíz). */
	onMover: (arrastrado: Arrastrado, destino: number | null) => void;
}

const TIPO_ARRASTRE = "application/x-cosmoflow";

const fila =
	"group flex h-8 w-full items-center gap-1 rounded-md pr-1 text-sm text-tinta-suave hover:bg-elevada";

const arrastrar = (arrastrado: Arrastrado) => (e: DragEvent) => {
	e.dataTransfer.setData(TIPO_ARRASTRE, JSON.stringify(arrastrado));
	e.dataTransfer.effectAllowed = "move";
};

export function FilaNota({
	nota,
	abierta,
	search,
	nivel = 0,
	arrastrable = false,
}: {
	nota: NotaIndiceDto;
	abierta: boolean;
	search: ContextoNotaSearch;
	nivel?: number;
	arrastrable?: boolean;
}) {
	return (
		<Link
			to="/notas/$id"
			params={{ id: String(nota.id) }}
			search={search}
			aria-current={abierta ? "page" : undefined}
			draggable={arrastrable}
			onDragStart={
				arrastrable ? arrastrar({ tipo: "nota", id: nota.id }) : undefined
			}
			className={cn(fila, "gap-1.5", abierta && "bg-elevada text-tinta")}
			style={{ paddingLeft: `${nivel * 0.875 + 0.375}rem` }}
		>
			{nota.color ? (
				<PuntoColor color={nota.color} />
			) : (
				<FileText className="h-3.5 w-3.5 shrink-0 text-tinta-tenue" />
			)}
			<span className="truncate">{nota.titulo}</span>
		</Link>
	);
}

/**
 * Explorador tipo Obsidian: carpetas anidadas y plegables, con sus notas dentro.
 * Clic derecho (o tecla de menú) abre las acciones; notas y carpetas se arrastran.
 */
export function ArbolCarpetas({
	carpetas,
	notas,
	notaAbierta,
	searchNota,
	seleccionada,
	onSeleccionar,
	editable,
	onNuevaNota,
	onNueva,
	onEditar,
	onEliminar,
	onDescargar,
	onMover,
}: ArbolCarpetasProps) {
	const [plegadas, setPlegadas] = useState<Set<number>>(new Set());
	const [menu, setMenu] = useState<MenuAbierto>();
	const cerrarMenu = useCallback(() => setMenu(undefined), []);
	// "raiz" o el id de la carpeta sobre la que se arrastra.
	const [destino, setDestino] = useState<number | "raiz">();
	const conHijas = new Set<number | null>([
		...carpetas.map((c) => c.padreId),
		...notas.map((n) => n.carpetaId),
	]);
	const plegar = (id: number) =>
		setPlegadas((p) => {
			const nuevas = new Set(p);
			if (!nuevas.delete(id)) nuevas.add(id);
			return nuevas;
		});

	const abrirMenu = (carpeta: CarpetaDto | null) => (e: MouseEvent) => {
		e.preventDefault();
		const id = carpeta?.id ?? null;
		const opciones: OpcionMenu[] = editable
			? [
					{
						texto: "Nueva nota",
						icono: FilePlus,
						onClick: () => onNuevaNota(id),
					},
					{
						texto: carpeta ? "Nueva subcarpeta" : "Nueva carpeta",
						icono: FolderPlus,
						onClick: () => onNueva(id),
					},
				]
			: [];
		if (carpeta && editable)
			opciones.push({
				texto: "Editar",
				icono: Pencil,
				onClick: () => onEditar(carpeta),
			});
		opciones.push({
			texto: carpeta ? "Descargar (.zip)" : "Descargar todas (.zip)",
			icono: Download,
			onClick: () => onDescargar(carpeta),
		});
		if (carpeta && editable)
			opciones.push({
				texto: "Eliminar",
				icono: Trash2,
				peligrosa: true,
				onClick: () => onEliminar(carpeta),
			});
		// Con teclado (Shift+F10) no hay coordenadas del puntero: junto a la fila.
		const caja = e.currentTarget.getBoundingClientRect();
		const x = e.clientX || caja.left + 24;
		const y = e.clientY || caja.bottom;
		setMenu({ x, y, opciones });
	};

	const soltable = (id: number | null) =>
		editable
			? {
					onDragOver: (e: DragEvent) => {
						if (!e.dataTransfer.types.includes(TIPO_ARRASTRE)) return;
						e.preventDefault();
						setDestino(id ?? "raiz");
					},
					onDragLeave: () => setDestino(undefined),
					onDrop: (e: DragEvent) => {
						e.preventDefault();
						setDestino(undefined);
						const dato = e.dataTransfer.getData(TIPO_ARRASTRE);
						if (!dato) return;
						const arrastrado: Arrastrado = JSON.parse(dato);
						// Una carpeta no puede entrar en sí misma ni en una descendiente.
						if (
							arrastrado.tipo === "carpeta" &&
							id !== null &&
							subarbol(arrastrado.id, carpetas).has(id)
						)
							return;
						onMover(arrastrado, id);
					},
				}
			: {};

	const resaltada = "bg-indigo-950/40 ring-1 ring-indigo-500";

	return (
		<nav aria-label="Carpetas" className="space-y-0.5">
			<button
				type="button"
				onClick={() => onSeleccionar(undefined)}
				onContextMenu={abrirMenu(null)}
				{...soltable(null)}
				className={cn(
					fila,
					"pl-2 text-left font-medium",
					seleccionada === undefined && "bg-elevada text-tinta",
					destino === "raiz" && resaltada,
				)}
			>
				Raíz
			</button>
			{filasExplorador(carpetas, notas, plegadas).map((elemento) => {
				if (elemento.tipo === "nota")
					return (
						<FilaNota
							key={`n${elemento.nota.id}`}
							nota={elemento.nota}
							nivel={elemento.nivel}
							abierta={elemento.nota.id === notaAbierta}
							search={searchNota}
							arrastrable={editable}
						/>
					);
				const { carpeta, nivel } = elemento;
				return (
					// biome-ignore lint/a11y/noStaticElementInteractions: arrastrar y el menú son atajos; con teclado, el menú sale de sus botones (Shift+F10) y mover está en «Editar»
					<div
						key={carpeta.id}
						draggable={editable}
						onDragStart={arrastrar({ tipo: "carpeta", id: carpeta.id })}
						onContextMenu={abrirMenu(carpeta)}
						{...soltable(carpeta.id)}
						className={cn(
							fila,
							seleccionada === carpeta.id && "bg-elevada text-tinta",
							destino === carpeta.id && resaltada,
						)}
						style={{ paddingLeft: `${nivel * 0.875}rem` }}
					>
						<button
							type="button"
							aria-label={plegadas.has(carpeta.id) ? "Desplegar" : "Plegar"}
							aria-expanded={!plegadas.has(carpeta.id)}
							onClick={() => plegar(carpeta.id)}
							className={cn(
								"flex h-6 w-5 shrink-0 items-center justify-center text-tinta-tenue",
								!conHijas.has(carpeta.id) && "invisible",
							)}
						>
							<ChevronRight
								className={cn(
									"h-3.5 w-3.5 transition-transform",
									!plegadas.has(carpeta.id) && "rotate-90",
								)}
							/>
						</button>
						<button
							type="button"
							onClick={() => {
								onSeleccionar(carpeta.id);
								plegar(carpeta.id);
							}}
							aria-current={seleccionada === carpeta.id ? "page" : undefined}
							className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
							style={carpeta.color ? { color: carpeta.color } : undefined}
						>
							<IconoCarpeta
								icono={carpeta.icono}
								className={carpeta.color ? "text-current" : undefined}
							/>
							<span className="truncate">{carpeta.nombre}</span>
						</button>
					</div>
				);
			})}
			<MenuContextual menu={menu} onCerrar={cerrarMenu} />
		</nav>
	);
}
