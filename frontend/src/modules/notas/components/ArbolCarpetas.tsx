import { Link } from "@tanstack/react-router";
import {
	ChevronRight,
	Download,
	FileText,
	FolderPlus,
	Pencil,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { PuntoColor } from "@/core/components/ui/PuntoColor";
import { cn } from "@/core/utils/cn";
import type { CarpetaDto, NotaDto } from "../api/notasApi";
import type { ContextoNotaSearch } from "../schemas/notaSchemas";
import { filasExplorador } from "../utils/arbolCarpetas";

interface ArbolCarpetasProps {
	carpetas: CarpetaDto[];
	notas: NotaDto[];
	notaAbierta?: number;
	searchNota: ContextoNotaSearch;
	/** Donde se crean las notas nuevas; sin ella, en la raíz. */
	seleccionada?: number;
	onSeleccionar: (carpetaId?: number) => void;
	/** Sin acciones de edición si no hay permiso. */
	editable: boolean;
	onNueva: (padreId: number | null) => void;
	onEditar: (carpeta: CarpetaDto) => void;
	onEliminar: (carpeta: CarpetaDto) => void;
	/** `null`: todas las notas del ámbito. */
	onDescargar: (carpeta: CarpetaDto | null) => void;
}

const fila =
	"group flex h-8 w-full items-center gap-1 rounded-md pr-1 text-sm text-tinta-suave hover:bg-elevada";

export function FilaNota({
	nota,
	abierta,
	search,
	nivel = 0,
}: {
	nota: NotaDto;
	abierta: boolean;
	search: ContextoNotaSearch;
	nivel?: number;
}) {
	return (
		<Link
			to="/notas/$id"
			params={{ id: String(nota.id) }}
			search={search}
			aria-current={abierta ? "page" : undefined}
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

/** Explorador tipo Obsidian: carpetas anidadas y plegables, con sus notas dentro. */
export function ArbolCarpetas({
	carpetas,
	notas,
	notaAbierta,
	searchNota,
	seleccionada,
	onSeleccionar,
	editable,
	onNueva,
	onEditar,
	onEliminar,
	onDescargar,
}: ArbolCarpetasProps) {
	const [plegadas, setPlegadas] = useState<Set<number>>(new Set());
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

	return (
		<nav aria-label="Carpetas" className="space-y-0.5">
			<div
				className={cn(
					fila,
					seleccionada === undefined && "bg-elevada text-tinta",
				)}
			>
				<button
					type="button"
					onClick={() => onSeleccionar(undefined)}
					className="flex-1 truncate pl-2 text-left font-medium"
				>
					Raíz
				</button>
				<Button
					variant="ghost"
					size="sm"
					aria-label="Descargar todas (.zip)"
					title="Descargar todas (.zip)"
					onClick={() => onDescargar(null)}
				>
					<Download className="h-3.5 w-3.5" />
				</Button>
				{editable && (
					<Button
						variant="ghost"
						size="sm"
						aria-label="Nueva carpeta"
						title="Nueva carpeta"
						onClick={() => onNueva(null)}
					>
						<FolderPlus className="h-3.5 w-3.5" />
					</Button>
				)}
			</div>
			{filasExplorador(carpetas, notas, plegadas).map((elemento) => {
				if (elemento.tipo === "nota")
					return (
						<FilaNota
							key={`n${elemento.nota.id}`}
							nota={elemento.nota}
							nivel={elemento.nivel}
							abierta={elemento.nota.id === notaAbierta}
							search={searchNota}
						/>
					);
				const { carpeta, nivel } = elemento;
				return (
					<div
						key={carpeta.id}
						className={cn(
							fila,
							seleccionada === carpeta.id && "bg-elevada text-tinta",
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
						>
							<span aria-hidden>{carpeta.icono ?? "📁"}</span>
							<span
								className="truncate"
								style={carpeta.color ? { color: carpeta.color } : undefined}
							>
								{carpeta.nombre}
							</span>
						</button>
						<span className="hidden shrink-0 group-focus-within:flex group-hover:flex [@media(hover:none)]:flex">
							<Button
								variant="ghost"
								size="sm"
								aria-label={`Descargar ${carpeta.nombre} (.zip)`}
								onClick={() => onDescargar(carpeta)}
							>
								<Download className="h-3.5 w-3.5" />
							</Button>
							{editable && (
								<>
									<Button
										variant="ghost"
										size="sm"
										aria-label={`Nueva carpeta en ${carpeta.nombre}`}
										onClick={() => onNueva(carpeta.id)}
									>
										<FolderPlus className="h-3.5 w-3.5" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										aria-label={`Editar ${carpeta.nombre}`}
										onClick={() => onEditar(carpeta)}
									>
										<Pencil className="h-3.5 w-3.5" />
									</Button>
									<Button
										variant="dangerGhost"
										size="sm"
										aria-label={`Eliminar ${carpeta.nombre}`}
										onClick={() => onEliminar(carpeta)}
									>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								</>
							)}
						</span>
					</div>
				);
			})}
		</nav>
	);
}
