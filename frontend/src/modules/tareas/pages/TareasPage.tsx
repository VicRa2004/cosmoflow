import { useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Input } from "@/core/components/ui/Input";
import { Select } from "@/core/components/ui/Select";
import type { EstadoTarea, TareaDto } from "../api/tareasApi";
import { TareaLectura } from "../components/TareaLectura";
import { TareasTable } from "../components/TareasTable";
import { useEliminarTareaMutation } from "../hooks/useTareasMutation";
import { useTagsDisponibles } from "@/modules/tags/hooks/useTagsDisponibles";
import { useTareasQuery } from "../hooks/useTareasQuery";
import {
	type ContextoTareaSearch,
	ETIQUETAS_ESTADO,
} from "../schemas/tareaSchemas";
import { useEquiposQuery } from "@/modules/equipos/hooks/useEquipos";
import { useProyectosQuery } from "@/modules/proyectos/hooks/useProyectos";

/** «Tareas · Plataforma»: nombre del equipo o proyecto de la lista. */
function TituloContexto({
	organizacionId,
	equipoId,
	proyectoId,
}: Required<Pick<ContextoTareaSearch, "organizacionId">> &
	ContextoTareaSearch) {
	const { data: equipos } = useEquiposQuery(organizacionId);
	const { data: proyectos } = useProyectosQuery(organizacionId);
	const nombre = equipoId
		? equipos?.find((e) => e.id === equipoId)?.nombre
		: proyectos?.find((p) => p.id === proyectoId)?.nombre;
	return <>Tareas · {nombre ?? "…"}</>;
}

/** Sin `contexto`, las personales; con él, las de ese equipo o proyecto. */
export function TareasPage({
	contexto = {},
}: {
	contexto?: ContextoTareaSearch;
}) {
	const { organizacionId, equipoId, proyectoId } = contexto;
	const enContexto =
		organizacionId !== undefined && Boolean(equipoId || proyectoId);
	const { puede } = usePermisos();
	const [pagina, setPagina] = useState(1);
	const [busqueda, setBusqueda] = useState("");
	const [estado, setEstado] = useState<EstadoTarea | "">("");
	const [tagId, setTagId] = useState("");
	const { tags } = useTagsDisponibles(enContexto ? organizacionId : undefined);
	const navigate = useNavigate();
	const editar = (tarea: TareaDto) =>
		navigate({ to: "/tareas/$id", params: { id: String(tarea.id) } });
	const [leyendo, setLeyendo] = useState<TareaDto | null>(null);
	const [eliminando, setEliminando] = useState<TareaDto | null>(null);
	const eliminar = useEliminarTareaMutation();
	const { data, isLoading, error } = useTareasQuery({
		pagina,
		limite: 10,
		busqueda: busqueda.trim() || undefined,
		estado: estado || undefined,
		tagId: tagId ? Number(tagId) : undefined,
		...(enContexto && { equipoId, proyectoId }),
	});

	return (
		<div className="space-y-6">
			<EncabezadoPagina
				titulo={
					enContexto && organizacionId ? (
						<TituloContexto
							organizacionId={organizacionId}
							equipoId={equipoId}
							proyectoId={proyectoId}
						/>
					) : (
						"Tareas"
					)
				}
			>
				<div className="w-full sm:w-44">
					<Select
						aria-label="Filtrar por estado"
						value={estado}
						onChange={(e) => {
							setEstado(e.target.value as EstadoTarea | "");
							setPagina(1);
						}}
					>
						<option value="">Todos los estados</option>
						{Object.entries(ETIQUETAS_ESTADO).map(([valor, texto]) => (
							<option key={valor} value={valor}>
								{texto}
							</option>
						))}
					</Select>
				</div>
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
						aria-label="Buscar por título"
						placeholder="Buscar por título..."
						value={busqueda}
						onChange={(e) => {
							setBusqueda(e.target.value);
							setPagina(1);
						}}
						className="pl-9"
					/>
					<Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-tinta-tenue" />
				</div>
				{puede("tareas:crear") && (
					<Button
						onClick={() =>
							navigate({
								to: "/tareas/nueva",
								search: enContexto ? contexto : {},
							})
						}
					>
						<Plus className="h-4 w-4" />
						Nueva
					</Button>
				)}
			</EncabezadoPagina>

			<TareasTable
				pagina={data}
				isLoading={isLoading}
				error={error}
				onCambioPagina={setPagina}
				onAbrir={setLeyendo}
				onEditar={editar}
				onEliminar={setEliminando}
			/>

			<TareaLectura
				tarea={leyendo}
				onCerrar={() => setLeyendo(null)}
				onEditar={editar}
			/>

			<ConfirmDialog
				abierto={eliminando !== null}
				titulo="¿Eliminar tarea?"
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
