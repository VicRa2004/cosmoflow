import {
	ChevronRight,
	Download,
	FolderPlus,
	Pencil,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { cn } from "@/core/utils/cn";
import type { CarpetaDto } from "../api/notasApi";
import { ordenEnArbol } from "../utils/arbolCarpetas";

interface ArbolCarpetasProps {
	carpetas: CarpetaDto[];
	/** Sin ella, «Todas las notas». */
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

/** Explorador tipo Obsidian: carpetas anidadas, plegables, con su icono y color. */
export function ArbolCarpetas({
	carpetas,
	seleccionada,
	onSeleccionar,
	editable,
	onNueva,
	onEditar,
	onEliminar,
	onDescargar,
}: ArbolCarpetasProps) {
	const [plegadas, setPlegadas] = useState<Set<number>>(new Set());
	const conHijas = new Set(carpetas.map((c) => c.padreId));
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
					Todas las notas
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
			{ordenEnArbol(carpetas, plegadas).map(({ carpeta, nivel }) => (
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
						onClick={() => onSeleccionar(carpeta.id)}
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
			))}
		</nav>
	);
}
