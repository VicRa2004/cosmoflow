import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { FolderInput, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Spinner } from "@/core/components/ui/Spinner";
import { PaginaLectura } from "@/modules/adjuntos/components/PaginaLectura";
import { useMiembrosQuery } from "@/modules/organizaciones/hooks/useMiembros";
import { TagsBadges } from "@/modules/tags/components/TagsBadges";
import type { TareaDto } from "../api/tareasApi";
import { formatearDia, VencimientoTarea } from "../components/celdas";
import { MoverTareaDialog } from "../components/MoverTareaDialog";
import { useEliminarTareaMutation } from "../hooks/useTareasMutation";
import { useTareaQuery } from "../hooks/useTareasQuery";
import { ETIQUETAS_ESTADO, ETIQUETAS_PRIORIDAD } from "../schemas/tareaSchemas";

function Responsables({
	organizacionId,
	ids,
}: {
	organizacionId: number;
	ids: number[];
}) {
	const { data: miembros = [] } = useMiembrosQuery(organizacionId);
	const nombres = ids.map(
		(id) => miembros.find((m) => m.usuarioId === id)?.nombre ?? "…",
	);
	return <>{nombres.join(", ")}</>;
}

function Detalles({ tarea }: { tarea: TareaDto }) {
	return (
		<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
			<dt className="text-tinta-tenue">Estado</dt>
			<dd>{ETIQUETAS_ESTADO[tarea.estado]}</dd>
			<dt className="text-tinta-tenue">Prioridad</dt>
			<dd>{ETIQUETAS_PRIORIDAD[tarea.prioridad]}</dd>
			{tarea.fechaInicio && (
				<>
					<dt className="text-tinta-tenue">Inicio</dt>
					<dd>{formatearDia(tarea.fechaInicio)}</dd>
				</>
			)}
			<dt className="text-tinta-tenue">Vence</dt>
			<dd>
				<VencimientoTarea tarea={tarea} />
			</dd>
			{tarea.organizacionId !== null && tarea.responsableIds.length > 0 && (
				<>
					<dt className="text-tinta-tenue">Responsables</dt>
					<dd>
						<Responsables
							organizacionId={tarea.organizacionId}
							ids={tarea.responsableIds}
						/>
					</dd>
				</>
			)}
			{tarea.tagIds.length > 0 && (
				<>
					<dt className="text-tinta-tenue">Tags</dt>
					<dd>
						<TagsBadges
							tagIds={tarea.tagIds}
							organizacionId={tarea.organizacionId}
						/>
					</dd>
				</>
			)}
		</dl>
	);
}

/** Lectura de una tarea: propiedades, contenido y las acciones que permita el usuario. */
export function TareaLecturaPage({ id }: { id: number }) {
	const router = useRouter();
	const navigate = useNavigate();
	const puedeVolver = useCanGoBack();
	const { puede } = usePermisos();
	const { data: tarea, error } = useTareaQuery(id);
	const eliminar = useEliminarTareaMutation();
	const [moviendo, setMoviendo] = useState(false);
	const [eliminando, setEliminando] = useState(false);
	// Vuelve a donde se abrió (lista, portada o correo); si se entró por URL, a la lista.
	const volver = () =>
		puedeVolver ? router.history.back() : navigate({ to: "/tareas" });

	if (error) throw error;
	if (!tarea) {
		return (
			<div className="flex justify-center py-16 text-tinta-tenue">
				<Spinner />
			</div>
		);
	}
	return (
		<>
			<PaginaLectura
				onVolver={volver}
				titulo={tarea.titulo}
				contenido={tarea.contenido}
				detalles={<Detalles tarea={tarea} />}
				acciones={
					<>
						{puede("tareas:eliminar") && (
							<Button
								variant="dangerGhost"
								size="sm"
								onClick={() => setEliminando(true)}
							>
								<Trash2 className="h-4 w-4" />
								Eliminar
							</Button>
						)}
						{tarea.organizacionId === null && puede("tareas:actualizar") && (
							<Button
								variant="secondary"
								size="sm"
								onClick={() => setMoviendo(true)}
							>
								<FolderInput className="h-4 w-4" />
								Mover a una organización
							</Button>
						)}
						{puede("tareas:actualizar") && (
							<Button
								size="sm"
								onClick={() =>
									navigate({
										to: "/tareas/$id/editar",
										params: { id: String(id) },
									})
								}
							>
								<Pencil className="h-4 w-4" />
								Editar
							</Button>
						)}
					</>
				}
			/>
			<MoverTareaDialog
				tarea={tarea}
				abierto={moviendo}
				onCerrar={() => setMoviendo(false)}
				onMovida={() => setMoviendo(false)}
			/>
			<ConfirmDialog
				abierto={eliminando}
				titulo="¿Eliminar tarea?"
				mensaje="Esta acción no se puede deshacer."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setEliminando(false)}
				onConfirmar={() => eliminar.mutate(id, { onSuccess: volver })}
			/>
		</>
	);
}
