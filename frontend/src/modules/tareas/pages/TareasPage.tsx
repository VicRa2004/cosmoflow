import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Input } from "@/core/components/ui/Input";
import { Select } from "@/core/components/ui/Select";
import { destinoDe, type EstadoTarea, type TareaDto } from "../api/tareasApi";
import { AsignarTareaDialog } from "../components/AsignarTareaDialog";
import { MenuNuevo } from "../components/MenuNuevo";
import { SelectorContextoTareas } from "../components/SelectorContextoTareas";
import { TareasTable } from "../components/TareasTable";
import { useEliminarTareaMutation } from "../hooks/useTareasMutation";
import { useTagsDisponibles } from "@/modules/tags/hooks/useTagsDisponibles";
import { useTareasQuery } from "../hooks/useTareasQuery";
import {
	type ContextoTareaSearch,
	ETIQUETAS_ESTADO,
	type ListaTareasSearch,
} from "../schemas/tareaSchemas";
import { useNombresContexto } from "@/modules/organizaciones/hooks/useNombresContexto";

/** «Tareas · Plataforma»: nombre del equipo, proyecto u organización de la lista. */
function TituloContexto({
	organizacionId,
	equipoId,
	proyectoId,
}: Required<Pick<ContextoTareaSearch, "organizacionId">> &
	ContextoTareaSearch) {
	const { organizacion, grupo } = useNombresContexto({
		organizacionId,
		equipoId,
		proyectoId,
	});
	const nombre = equipoId || proyectoId ? grupo : organizacion;
	return <>Tareas · {nombre ?? "…"}</>;
}

/**
 * Sin `contexto`, las personales; con él, las de esa organización, equipo o
 * proyecto, o las asignadas. El selector cambia de una vista a otra.
 */
export function TareasPage({
	contexto = {},
}: {
	contexto?: ListaTareasSearch;
}) {
	const { organizacionId, equipoId, proyectoId, asignadas } = contexto;
	const enContexto = organizacionId !== undefined;
	const [pagina, setPagina] = useState(1);
	const [busqueda, setBusqueda] = useState("");
	const [estado, setEstado] = useState<EstadoTarea | "">("");
	const [tagId, setTagId] = useState("");
	const { tags: tagsDisponibles } = useTagsDisponibles(
		enContexto ? organizacionId : undefined,
	);
	// Las asignadas mezclan organizaciones: sin filtro de tag.
	const tags = asignadas ? [] : tagsDisponibles;
	const navigate = useNavigate();
	const [asignando, setAsignando] = useState<
		(TareaDto & { organizacionId: number }) | null
	>(null);
	const abrir = (tarea: TareaDto) =>
		navigate({ to: "/tareas/$id", params: { id: String(tarea.id) } });
	const editar = (tarea: TareaDto) =>
		navigate({ to: "/tareas/$id/editar", params: { id: String(tarea.id) } });
	const [eliminando, setEliminando] = useState<TareaDto | null>(null);
	const eliminar = useEliminarTareaMutation();
	const { data, isLoading, error } = useTareasQuery({
		pagina,
		limite: 10,
		busqueda: busqueda.trim() || undefined,
		estado: estado || undefined,
		tagId: tagId ? Number(tagId) : undefined,
		...(asignadas
			? { asignadas }
			: enContexto && destinoDe({ organizacionId, equipoId, proyectoId })),
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
					) : asignadas ? (
						"Tareas · Asignadas a mí"
					) : (
						"Tareas"
					)
				}
			>
				<div className="w-full sm:w-56">
					<SelectorContextoTareas
						valor={contexto}
						onChange={(search) => {
							setPagina(1);
							setTagId("");
							navigate({ to: "/tareas", search });
						}}
					/>
				</div>
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
				<MenuNuevo
					soloTareas
					contexto={
						enContexto ? { organizacionId, equipoId, proyectoId } : undefined
					}
				/>
			</EncabezadoPagina>

			<TareasTable
				pagina={data}
				isLoading={isLoading}
				error={error}
				onCambioPagina={setPagina}
				onAbrir={abrir}
				onEditar={editar}
				onEliminar={setEliminando}
				onAsignar={enContexto || asignadas ? setAsignando : undefined}
				mostrarDonde={asignadas}
			/>

			{asignando && (
				<AsignarTareaDialog
					key={asignando.id}
					tarea={asignando}
					onCerrar={() => setAsignando(null)}
				/>
			)}

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
