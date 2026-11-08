import { useNavigate } from "@tanstack/react-router";
import { Plus, Search, SlidersHorizontal, Upload } from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Input } from "@/core/components/ui/Input";
import { Select } from "@/core/components/ui/Select";
import { useTagsDisponibles } from "@/modules/tags/hooks/useTagsDisponibles";
import type { NotaDto } from "../api/notasApi";
import {
	FiltrosFecha,
	rangosAParams,
	sinRangos,
} from "../components/FiltrosFecha";
import { ImportarObsidianDialog } from "../components/ImportarObsidianDialog";
import { NotasTable } from "../components/NotasTable";
import { PanelCarpetas } from "../components/PanelCarpetas";
import { useCarpetasQuery } from "../hooks/useCarpetas";
import { rutaDe } from "../utils/arbolCarpetas";
import { useEliminarNotaMutation } from "../hooks/useNotasMutation";
import { useNotasQuery } from "../hooks/useNotasQuery";
import type { ContextoNotaSearch } from "../schemas/notaSchemas";
import { useProyectosQuery } from "@/modules/proyectos/hooks/useProyectos";

/** «Notas · Lanzamiento»: nombre del proyecto de la lista. */
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

/** Sin `contexto`, las personales; con él, las de ese proyecto (RN-33). */
export function NotasPage({
	contexto = {},
}: {
	contexto?: ContextoNotaSearch;
}) {
	const { organizacionId, proyectoId, carpetaId } = contexto;
	const deProyecto = organizacionId !== undefined && proyectoId !== undefined;
	const { puede } = usePermisos();
	const [pagina, setPagina] = useState(1);
	const [busqueda, setBusqueda] = useState("");
	const [tagId, setTagId] = useState("");
	const [verFiltros, setVerFiltros] = useState(false);
	const [rangos, setRangos] = useState(sinRangos);
	const [importando, setImportando] = useState(false);
	const { data: carpetas = [] } = useCarpetasQuery(
		deProyecto ? proyectoId : undefined,
	);
	const ruta = rutaDe(carpetaId ?? null, carpetas);
	const seleccionar = (id?: number) => {
		setPagina(1);
		navigate({ to: "/notas", search: { ...contexto, carpetaId: id } });
	};
	const { tags } = useTagsDisponibles(deProyecto ? organizacionId : undefined);
	const navigate = useNavigate();
	const abrir = (nota: NotaDto) =>
		navigate({ to: "/notas/$id", params: { id: String(nota.id) } });
	const editar = (nota: NotaDto) =>
		navigate({ to: "/notas/$id/editar", params: { id: String(nota.id) } });
	const [eliminando, setEliminando] = useState<NotaDto | null>(null);
	const eliminar = useEliminarNotaMutation();
	const { data, isLoading, error } = useNotasQuery({
		pagina,
		limite: 10,
		busqueda: busqueda.trim() || undefined,
		tagId: tagId ? Number(tagId) : undefined,
		carpetaId,
		...rangosAParams(rangos),
		...(deProyecto && { proyectoId }),
	});
	const filtrosActivos = Object.values(rangos).filter(Boolean).length;

	return (
		<div className="space-y-6">
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
				descripcion={ruta.length > 0 && ruta.join(" › ")}
			>
				{tags.length > 0 && (
					<div className="w-full sm:w-40">
						<Select
							aria-label="Filtrar por tag"
							value={tagId}
							onChange={(e) => {
								setTagId(e.target.value);
								setPagina(1);
							}}
						>
							<option value="">Todos los tags</option>
							{tags.map((tag) => (
								<option key={tag.id} value={tag.id}>
									{tag.nombre}
								</option>
							))}
						</Select>
					</div>
				)}
				<div className="relative w-full sm:w-64">
					<Input
						aria-label="Buscar en título y contenido"
						placeholder="Buscar en las notas..."
						value={busqueda}
						onChange={(e) => {
							setBusqueda(e.target.value);
							setPagina(1);
						}}
						className="pl-9"
					/>
					<Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-tinta-tenue" />
				</div>
				<Button
					variant="secondary"
					onClick={() => setVerFiltros((v) => !v)}
					aria-expanded={verFiltros}
				>
					<SlidersHorizontal className="h-4 w-4" />
					Fechas{filtrosActivos > 0 && ` (${filtrosActivos})`}
				</Button>
				{puede("notas:crear") && (
					<>
						<Button variant="secondary" onClick={() => setImportando(true)}>
							<Upload className="h-4 w-4" />
							Importar
						</Button>
						<Button
							onClick={() =>
								navigate({
									to: "/notas/nueva",
									search: deProyecto ? contexto : { carpetaId },
								})
							}
						>
							<Plus className="h-4 w-4" />
							Nueva
						</Button>
					</>
				)}
			</EncabezadoPagina>

			{verFiltros && (
				<div className="flex flex-wrap items-end gap-3">
					<FiltrosFecha
						valor={rangos}
						onChange={(r) => {
							setRangos(r);
							setPagina(1);
						}}
					/>
					{filtrosActivos > 0 && (
						<Button variant="ghost" onClick={() => setRangos(sinRangos)}>
							Limpiar
						</Button>
					)}
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
				<PanelCarpetas
					carpetas={carpetas}
					proyectoId={deProyecto ? proyectoId : undefined}
					seleccionada={carpetaId}
					onSeleccionar={seleccionar}
				/>
				<NotasTable
					pagina={data}
					isLoading={isLoading}
					error={error}
					onCambioPagina={setPagina}
					onAbrir={abrir}
					onEditar={editar}
					onEliminar={setEliminando}
				/>
			</div>

			<ImportarObsidianDialog
				abierto={importando}
				onCerrar={() => setImportando(false)}
				proyectoId={deProyecto ? proyectoId : undefined}
				carpetaId={carpetaId}
				nombreDestino={ruta.at(-1) ?? "la raíz"}
			/>

			<ConfirmDialog
				abierto={eliminando !== null}
				titulo="¿Eliminar nota?"
				mensaje="Esta acción no se puede deshacer."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setEliminando(null)}
				onConfirmar={() =>
					eliminando &&
					eliminar.mutate(eliminando.id, {
						onSuccess: () => setEliminando(null),
					})
				}
			/>
		</div>
	);
}
