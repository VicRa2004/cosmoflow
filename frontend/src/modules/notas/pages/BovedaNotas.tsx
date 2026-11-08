import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { FilePlus, Search, SlidersHorizontal, Upload } from "lucide-react";
import { type ReactNode, useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { Input } from "@/core/components/ui/Input";
import { Select } from "@/core/components/ui/Select";
import { cn } from "@/core/utils/cn";
import { useProyectosQuery } from "@/modules/proyectos/hooks/useProyectos";
import { useTagsDisponibles } from "@/modules/tags/hooks/useTagsDisponibles";
import { FilaNota } from "../components/ArbolCarpetas";
import {
	FiltrosFecha,
	rangosAParams,
	sinRangos,
} from "../components/FiltrosFecha";
import { ImportarObsidianDialog } from "../components/ImportarObsidianDialog";
import { PanelCarpetas } from "../components/PanelCarpetas";
import { useCarpetasQuery } from "../hooks/useCarpetas";
import { useExploradorNotas, useNotaQuery } from "../hooks/useNotasQuery";
import type { ContextoNotaSearch } from "../schemas/notaSchemas";
import { rutaDe } from "../utils/arbolCarpetas";

/** «Notas · Lanzamiento»: nombre del proyecto de la bóveda. */
function TituloProyecto({
	organizacionId,
	proyectoId,
}: {
	organizacionId: number;
	proyectoId: number;
}) {
	const { data: proyectos } = useProyectosQuery(organizacionId);
	const nombre = proyectos?.find((p) => p.id === proyectoId)?.nombre;
	return <>Notas · {nombre ?? "…"}</>;
}

/**
 * Bóveda tipo Obsidian: explorador con carpetas y notas a la izquierda y la nota
 * abierta (`children`) a la derecha. Sin `contexto`, las personales; con él, las de
 * ese proyecto (RN-33). En móvil se ve un panel u otro.
 */
export function BovedaNotas({
	contexto = {},
	children,
}: {
	contexto?: ContextoNotaSearch;
	children: ReactNode;
}) {
	const { id } = useParams({ strict: false });
	const notaAbierta = id ? Number(id) : undefined;
	const { data: nota } = useNotaQuery(notaAbierta);
	// Una nota abierta por URL no trae el contexto: manda el de la propia nota.
	const organizacionId = nota
		? (nota.organizacionId ?? undefined)
		: contexto.organizacionId;
	const proyectoId = nota
		? (nota.proyectoId ?? undefined)
		: contexto.proyectoId;
	const deProyecto = organizacionId !== undefined && proyectoId !== undefined;
	const ambito = deProyecto ? { organizacionId, proyectoId } : {};

	const { puede } = usePermisos();
	const navigate = useNavigate();
	const enRaiz = useLocation({ select: (l) => l.pathname === "/notas" });
	const [carpetaId, setCarpetaId] = useState(contexto.carpetaId);
	const [busqueda, setBusqueda] = useState("");
	const [tagId, setTagId] = useState("");
	const [verFiltros, setVerFiltros] = useState(false);
	const [rangos, setRangos] = useState(sinRangos);
	const [importando, setImportando] = useState(false);
	const { data: carpetas = [] } = useCarpetasQuery(
		deProyecto ? proyectoId : undefined,
	);
	const { tags } = useTagsDisponibles(deProyecto ? organizacionId : undefined);
	const filtrosFecha = Object.values(rangos).filter(Boolean).length;
	const texto = busqueda.trim();
	const filtrando = !!texto || !!tagId || filtrosFecha > 0;
	const { data: notas = [], isLoading } = useExploradorNotas({
		busqueda: texto || undefined,
		tagId: tagId ? Number(tagId) : undefined,
		...rangosAParams(rangos),
		...(deProyecto && { proyectoId }),
	});

	return (
		<div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
			<aside
				aria-label="Explorador de notas"
				className={cn(
					"flex-col gap-2 rounded-lg border border-borde bg-superficie p-2 lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100vh-7rem)]",
					enRaiz ? "flex" : "hidden",
				)}
			>
				<div className="flex items-center justify-between gap-1 pl-2">
					<h1 className="truncate text-sm font-semibold text-tinta">
						{deProyecto ? (
							<TituloProyecto
								organizacionId={organizacionId}
								proyectoId={proyectoId}
							/>
						) : (
							"Notas"
						)}
					</h1>
					<div className="flex shrink-0">
						<Button
							variant="ghost"
							size="sm"
							aria-label="Filtros"
							title="Filtros"
							aria-expanded={verFiltros}
							onClick={() => setVerFiltros((v) => !v)}
						>
							<SlidersHorizontal className="h-4 w-4" />
							{filtrosFecha > 0 && filtrosFecha}
						</Button>
						{puede("notas:crear") && (
							<>
								<Button
									variant="ghost"
									size="sm"
									aria-label="Importar de Obsidian"
									title="Importar de Obsidian"
									onClick={() => setImportando(true)}
								>
									<Upload className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									aria-label="Nueva nota"
									title="Nueva nota"
									onClick={() =>
										navigate({
											to: "/notas/nueva",
											search: { ...ambito, carpetaId },
										})
									}
								>
									<FilePlus className="h-4 w-4" />
								</Button>
							</>
						)}
					</div>
				</div>
				<div className="relative">
					<Input
						aria-label="Buscar en título y contenido"
						placeholder="Buscar..."
						value={busqueda}
						onChange={(e) => setBusqueda(e.target.value)}
						className="pl-9"
					/>
					<Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-tinta-tenue" />
				</div>
				{verFiltros && (
					<div className="space-y-3 px-1 py-2">
						{tags.length > 0 && (
							<Select
								aria-label="Filtrar por tag"
								value={tagId}
								onChange={(e) => setTagId(e.target.value)}
							>
								<option value="">Todos los tags</option>
								{tags.map((tag) => (
									<option key={tag.id} value={tag.id}>
										{tag.nombre}
									</option>
								))}
							</Select>
						)}
						<FiltrosFecha valor={rangos} onChange={setRangos} />
						{filtrosFecha > 0 && (
							<Button variant="ghost" onClick={() => setRangos(sinRangos)}>
								Limpiar
							</Button>
						)}
					</div>
				)}
				<div className="min-h-0 flex-1 overflow-y-auto">
					{filtrando ? (
						<nav aria-label="Resultados" className="space-y-0.5">
							{notas.map((n) => (
								<FilaNota
									key={n.id}
									nota={n}
									abierta={n.id === notaAbierta}
									search={ambito}
								/>
							))}
							{!isLoading && notas.length === 0 && (
								<p className="p-2 text-sm text-tinta-tenue">Sin resultados.</p>
							)}
						</nav>
					) : (
						<PanelCarpetas
							carpetas={carpetas}
							notas={notas}
							notaAbierta={notaAbierta}
							searchNota={ambito}
							proyectoId={deProyecto ? proyectoId : undefined}
							seleccionada={carpetaId}
							onSeleccionar={setCarpetaId}
						/>
					)}
				</div>
				<p className="px-2 text-xs text-tinta-tenue">
					{notas.length} {notas.length === 1 ? "nota" : "notas"}
				</p>
			</aside>

			<section className={cn("min-w-0", enRaiz && "hidden lg:block")}>
				{children}
			</section>

			<ImportarObsidianDialog
				abierto={importando}
				onCerrar={() => setImportando(false)}
				proyectoId={deProyecto ? proyectoId : undefined}
				carpetaId={carpetaId}
				nombreDestino={rutaDe(carpetaId ?? null, carpetas).at(-1) ?? "la raíz"}
			/>
		</div>
	);
}
