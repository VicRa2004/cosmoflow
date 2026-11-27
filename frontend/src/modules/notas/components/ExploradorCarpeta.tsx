import { Link } from "@tanstack/react-router";
import {
	ChevronRight,
	Copy,
	Download,
	FilePlus,
	FileText,
	FolderPlus,
	Pencil,
	Pin,
	Trash2,
} from "lucide-react";
import {
	type DragEvent,
	Fragment,
	type MouseEvent,
	useCallback,
	useState,
} from "react";
import { PuntoColor } from "@/core/components/ui/PuntoColor";
import { cn } from "@/core/utils/cn";
import type { CarpetaDto, NotaIndiceDto } from "../api/notasApi";
import type { ContextoNotaSearch } from "../schemas/notaSchemas";
import { usePreferenciasQuery } from "@/modules/configuracion/hooks/usePreferencias";
import { cadenaDe, contenidoDe, subarbol } from "../utils/arbolCarpetas";
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

interface ExploradorCarpetaProps {
	carpetas: CarpetaDto[];
	notas: NotaIndiceDto[];
	searchNota: ContextoNotaSearch;
	/** Carpeta abierta; sin ella, la raíz. */
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
	onDuplicarNota?: (nota: NotaIndiceDto) => void;
	onFijarNota?: (nota: NotaIndiceDto) => void;
}

const TIPO_ARRASTRE = "application/x-cosmoflow";

const fila =
	"flex h-11 w-full items-center gap-3 px-4 text-left text-sm text-tinta-suave hover:bg-elevada hover:text-tinta";
const miga =
	"rounded-md px-1.5 py-0.5 text-tinta-tenue hover:bg-elevada hover:text-tinta aria-[current=page]:text-tinta aria-[current=page]:font-medium";
const resaltada = "bg-indigo-950/40 ring-1 ring-indigo-500";

const arrastrar = (arrastrado: Arrastrado) => (e: DragEvent) => {
	e.dataTransfer.setData(TIPO_ARRASTRE, JSON.stringify(arrastrado));
	e.dataTransfer.effectAllowed = "move";
};

export function FilaNota({
	nota,
	search,
	ruta,
	arrastrable = false,
	onDuplicar,
	onFijar,
	onContextMenu,
}: {
	nota: NotaIndiceDto;
	search: ContextoNotaSearch;
	/** Carpeta de la nota, en los resultados de búsqueda. */
	ruta?: string;
	arrastrable?: boolean;
	onDuplicar?: (nota: NotaIndiceDto) => void;
	onFijar?: (nota: NotaIndiceDto) => void;
	onContextMenu?: (e: MouseEvent) => void;
}) {
	return (
		<div className="group/nota flex h-11 w-full items-center gap-2 px-4 text-sm text-tinta-suave hover:bg-elevada hover:text-tinta">
			<Link
				to="/notas/$id"
				params={{ id: String(nota.id) }}
				search={search}
				draggable={arrastrable}
				onDragStart={
					arrastrable ? arrastrar({ tipo: "nota", id: nota.id }) : undefined
				}
				onContextMenu={onContextMenu}
				className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left"
			>
				{nota.color ? (
					<PuntoColor color={nota.color} />
				) : (
					<FileText className="h-4 w-4 shrink-0 text-tinta-tenue" />
				)}
				{nota.isFijada && (
					<Pin
						aria-label="Fijada"
						className="h-3.5 w-3.5 shrink-0 text-indigo-400"
					/>
				)}
				<span className="truncate">{nota.titulo}</span>
				{ruta && (
					<span className="ml-auto shrink-0 truncate text-xs text-tinta-tenue">
						{ruta}
					</span>
				)}
			</Link>
			{(onFijar || onDuplicar) && (
				<div
					className={cn(
						"flex shrink-0 items-center gap-0.5 transition-opacity",
						nota.isFijada
							? "opacity-100"
							: "opacity-0 group-focus-within/nota:opacity-100 group-hover/nota:opacity-100 [@media(hover:none)]:opacity-100",
					)}
				>
					{onFijar && (
						<button
							type="button"
							onClick={() => onFijar(nota)}
							aria-label={nota.isFijada ? "Desfijar nota" : "Fijar nota"}
							title={nota.isFijada ? "Desfijar" : "Fijar"}
							className={cn(
								"rounded p-1 text-tinta-tenue hover:bg-superficie hover:text-tinta",
								nota.isFijada && "text-indigo-400",
							)}
						>
							<Pin className="h-3.5 w-3.5" />
						</button>
					)}
					{onDuplicar && (
						<button
							type="button"
							onClick={() => onDuplicar(nota)}
							aria-label="Duplicar nota"
							title="Duplicar"
							className="rounded p-1 text-tinta-tenue hover:bg-superficie hover:text-tinta"
						>
							<Copy className="h-3.5 w-3.5" />
						</button>
					)}
				</div>
			)}
		</div>
	);
}

/**
 * Explorador de archivos: migas de la carpeta abierta y su contenido (subcarpetas y
 * notas). Clic en una carpeta entra en ella; clic derecho (o tecla de menú) abre sus
 * acciones; notas y carpetas se arrastran a una carpeta o a una miga.
 */
export function ExploradorCarpeta({
	carpetas,
	notas,
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
	onDuplicarNota,
	onFijarNota,
}: ExploradorCarpetaProps) {
	const [menu, setMenu] = useState<MenuAbierto>();
	const cerrarMenu = useCallback(() => setMenu(undefined), []);
	// "raiz" o el id de la carpeta sobre la que se arrastra.
	const [destino, setDestino] = useState<number | "raiz">();
	const migas = cadenaDe(seleccionada ?? null, carpetas);
	const actual = migas.at(-1) ?? null;
	const orden = usePreferenciasQuery().data?.ordenNotas;
	const contenido = contenidoDe(actual?.id ?? null, carpetas, notas, orden);

	const abrirMenuNota = (nota: NotaIndiceDto) => (e: MouseEvent) => {
		if (!onFijarNota && !onDuplicarNota) return;
		e.preventDefault();
		e.stopPropagation();
		const opciones: OpcionMenu[] = [];
		if (onFijarNota) {
			opciones.push({
				texto: nota.isFijada ? "Desfijar" : "Fijar",
				icono: Pin,
				onClick: () => onFijarNota(nota),
			});
		}
		if (onDuplicarNota) {
			opciones.push({
				texto: "Duplicar",
				icono: Copy,
				onClick: () => onDuplicarNota(nota),
			});
		}
		if (opciones.length === 0) return;
		const caja = e.currentTarget.getBoundingClientRect();
		setMenu({
			x: e.clientX || caja.left + 24,
			y: e.clientY || caja.bottom,
			opciones,
		});
	};

	const abrirMenu = (carpeta: CarpetaDto | null) => (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
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

	return (
		<div className="space-y-3">
			<nav
				aria-label="Ruta de la carpeta"
				className="flex flex-wrap items-center gap-0.5 text-sm"
			>
				<button
					type="button"
					onClick={() => onSeleccionar(undefined)}
					onContextMenu={abrirMenu(null)}
					aria-current={actual ? undefined : "page"}
					{...soltable(null)}
					className={cn(miga, destino === "raiz" && resaltada)}
				>
					Raíz
				</button>
				{migas.map((carpeta) => (
					<Fragment key={carpeta.id}>
						<ChevronRight className="h-3.5 w-3.5 text-tinta-tenue" />
						<button
							type="button"
							onClick={() => onSeleccionar(carpeta.id)}
							onContextMenu={abrirMenu(carpeta)}
							aria-current={carpeta === actual ? "page" : undefined}
							{...soltable(carpeta.id)}
							className={cn(miga, destino === carpeta.id && resaltada)}
						>
							{carpeta.nombre}
						</button>
					</Fragment>
				))}
			</nav>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: clic derecho en el hueco = menú de la carpeta abierta; con teclado está en su miga */}
			<div
				onContextMenu={abrirMenu(actual)}
				className="min-h-48 divide-y divide-borde overflow-hidden rounded-lg border border-borde bg-superficie"
			>
				{contenido.carpetas.map((carpeta) => (
					<button
						key={carpeta.id}
						type="button"
						draggable={editable}
						onDragStart={arrastrar({ tipo: "carpeta", id: carpeta.id })}
						onClick={() => onSeleccionar(carpeta.id)}
						onContextMenu={abrirMenu(carpeta)}
						{...soltable(carpeta.id)}
						className={cn(fila, destino === carpeta.id && resaltada)}
						style={carpeta.color ? { color: carpeta.color } : undefined}
					>
						<IconoCarpeta
							icono={carpeta.icono}
							className={carpeta.color ? "text-current" : undefined}
						/>
						<span className="truncate">{carpeta.nombre}</span>
					</button>
				))}
				{contenido.notas.map((nota) => (
					<FilaNota
						key={nota.id}
						nota={nota}
						search={searchNota}
						arrastrable={editable}
						onDuplicar={onDuplicarNota}
						onFijar={onFijarNota}
						onContextMenu={abrirMenuNota(nota)}
					/>
				))}
				{contenido.carpetas.length + contenido.notas.length === 0 && (
					<p className="p-4 text-sm text-tinta-tenue">
						Carpeta vacía.{editable && " Clic derecho para crear."}
					</p>
				)}
			</div>
			<MenuContextual menu={menu} onCerrar={cerrarMenu} />
		</div>
	);
}
