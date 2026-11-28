import { Home } from "lucide-react";
import { usePermisos } from "@/core/auth/usePermisos";
import type { CarpetaDto, NotaIndiceDto } from "../api/notasApi";
import {
	useDuplicarNotaMutation,
	useFijarNotaMutation,
} from "../hooks/useNotasMutation";
import type { ContextoNotaSearch } from "../schemas/notaSchemas";
import {
	agruparPorCarpeta,
	type OrdenNotas,
	ordenarNotas,
	rutaDe,
} from "../utils/arbolCarpetas";
import { FilaNota } from "./ExploradorCarpeta";
import { IconoCarpeta } from "./IconoCarpeta";

/** Resultados de búsqueda agrupados por carpeta, como en Obsidian; el encabezado abre la carpeta. */
export function ResultadosAgrupados({
	notas,
	carpetas,
	orden,
	search,
	cargando,
	onAbrirCarpeta,
}: {
	notas: NotaIndiceDto[];
	carpetas: CarpetaDto[];
	orden: OrdenNotas;
	search: ContextoNotaSearch;
	cargando: boolean;
	onAbrirCarpeta: (carpetaId?: number) => void;
}) {
	const { puede } = usePermisos();
	const duplicarNota = useDuplicarNotaMutation();
	const fijarNota = useFijarNotaMutation();
	const grupos = agruparPorCarpeta(ordenarNotas(notas, orden), carpetas);

	if (!cargando && notas.length === 0)
		return (
			<p className="rounded-lg border border-borde bg-superficie p-4 text-sm text-tinta-tenue">
				Sin resultados.
			</p>
		);
	return (
		<nav aria-label="Resultados" className="space-y-3">
			{grupos.map(({ carpeta, notas: delGrupo }) => (
				<section
					key={carpeta?.id ?? "raiz"}
					className="overflow-hidden rounded-lg border border-borde bg-superficie"
				>
					<button
						type="button"
						onClick={() => onAbrirCarpeta(carpeta?.id)}
						className="flex w-full items-center gap-2 border-b border-borde bg-elevada px-4 py-2 text-left text-xs font-medium text-tinta-suave hover:text-tinta"
						style={carpeta?.color ? { color: carpeta.color } : undefined}
					>
						{carpeta ? (
							<IconoCarpeta
								icono={carpeta.icono}
								className={carpeta.color ? "text-current" : undefined}
							/>
						) : (
							<Home className="h-4 w-4" />
						)}
						<span className="truncate">
							{carpeta ? rutaDe(carpeta.id, carpetas).join(" › ") : "Raíz"}
						</span>
						<span className="ml-auto text-tinta-tenue">{delGrupo.length}</span>
					</button>
					<div className="divide-y divide-borde">
						{delGrupo.map((n) => (
							<FilaNota
								key={n.id}
								nota={n}
								search={search}
								onDuplicar={
									puede("notas:crear")
										? (nota) => duplicarNota.mutate(nota.id)
										: undefined
								}
								onFijar={
									puede("notas:actualizar")
										? (nota) =>
												fijarNota.mutate({
													id: nota.id,
													isFijada: !nota.isFijada,
												})
										: undefined
								}
							/>
						))}
					</div>
				</section>
			))}
		</nav>
	);
}
