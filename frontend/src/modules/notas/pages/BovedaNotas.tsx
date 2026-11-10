import { useNavigate } from "@tanstack/react-router";
import { FilePlus, Search, SlidersHorizontal, Upload } from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { Input } from "@/core/components/ui/Input";
import { Select } from "@/core/components/ui/Select";
import { useProyectosQuery } from "@/modules/proyectos/hooks/useProyectos";
import { useTagsDisponibles } from "@/modules/tags/hooks/useTagsDisponibles";
import { FilaNota } from "../components/ExploradorCarpeta";
import {
	FiltrosFecha,
	rangosAParams,
	sinRangos,
} from "../components/FiltrosFecha";
import { ImportarObsidianDialog } from "../components/ImportarObsidianDialog";
import { PanelCarpetas } from "../components/PanelCarpetas";
import { useCarpetasQuery } from "../hooks/useCarpetas";
import { useExploradorNotas } from "../hooks/useNotasQuery";
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
 * Bóveda como explorador de archivos a página completa: la carpeta abierta
 * (`?carpetaId=`) con sus subcarpetas y notas. Sin `organizacionId`/`proyectoId`,
 * las personales; con ellos, las de ese proyecto (RN-33).
 */
export function BovedaNotas({ contexto }: { contexto: ContextoNotaSearch }) {
	const { organizacionId, proyectoId, carpetaId } = contexto;
	const deProyecto = organizacionId !== undefined && proyectoId !== undefined;
	const ambito = deProyecto ? { organizacionId, proyectoId } : {};

	const { puede } = usePermisos();
	const navigate = useNavigate();
	const abrir = (id?: number) =>
		navigate({ to: "/notas", search: { ...ambito, carpetaId: id } });
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
		<div className="space-y-4">
			<EncabezadoPagina
				titulo={
					deProyecto ? (
						<TituloProyecto
							organizacionId={organizacionId}
							proyectoId={proyectoId}
						/>
					) : (
						"Notas"
					)
				}
			>
				<div className="relative sm:w-72">
					<Input
						aria-label="Buscar en título y contenido"
						placeholder="Buscar..."
						value={busqueda}
						onChange={(e) => setBusqueda(e.target.value)}
						className="pl-9"
					/>
					<Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-tinta-tenue" />
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
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
								aria-label="Importar de Obsidian"
								title="Importar de Obsidian"
								onClick={() => setImportando(true)}
							>
								<Upload className="h-4 w-4" />
							</Button>
							<Button
								onClick={() =>
									navigate({
										to: "/notas/nueva",
										search: { ...ambito, carpetaId },
									})
								}
							>
								<FilePlus className="h-4 w-4" />
								Nueva nota
							</Button>
						</>
					)}
				</div>
			</EncabezadoPagina>
			{verFiltros && (
				<div className="flex flex-wrap items-start gap-3">
					{tags.length > 0 && (
						<Select
							aria-label="Filtrar por tag"
							value={tagId}
							onChange={(e) => setTagId(e.target.value)}
							className="sm:w-56"
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
			{filtrando ? (
				<nav
					aria-label="Resultados"
					className="divide-y divide-borde overflow-hidden rounded-lg border border-borde bg-superficie"
				>
					{notas.map((n) => (
						<FilaNota
							key={n.id}
							nota={n}
							search={ambito}
							ruta={rutaDe(n.carpetaId, carpetas).join(" › ")}
						/>
					))}
					{!isLoading && notas.length === 0 && (
						<p className="p-4 text-sm text-tinta-tenue">Sin resultados.</p>
					)}
				</nav>
			) : (
				<PanelCarpetas
					carpetas={carpetas}
					notas={notas}
					searchNota={ambito}
					proyectoId={deProyecto ? proyectoId : undefined}
					seleccionada={carpetaId}
					onSeleccionar={abrir}
				/>
			)}
			<p className="text-xs text-tinta-tenue">
				{notas.length} {notas.length === 1 ? "nota" : "notas"}
			</p>
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
