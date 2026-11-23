import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import {
	Copy,
	FolderInput,
	LayoutTemplate,
	Pencil,
	Pin,
	PinOff,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { MenuAcciones } from "@/core/components/ui/MenuAcciones";
import { Spinner } from "@/core/components/ui/Spinner";
import { PaginaLectura } from "@/modules/adjuntos/components/PaginaLectura";
import { GuardarPlantillaDialog } from "@/modules/plantillas/components/GuardarPlantillaDialog";
import { ActividadTarea } from "../components/ActividadTarea";
import { BotonCompletar } from "../components/BotonCompletar";
import { ChecklistSubtareas } from "../components/ChecklistSubtareas";
import { ComentariosTarea } from "../components/ComentariosTarea";
import { DetallesTarea } from "../components/DetallesTarea";
import { MoverTareaDialog } from "../components/MoverTareaDialog";
import {
	useDuplicarTareaMutation,
	useEliminarTareaMutation,
	useFijarTareaMutation,
} from "../hooks/useTareasMutation";
import { useTareaQuery } from "../hooks/useTareasQuery";

/** Lectura de una tarea: propiedades, contenido y las acciones que permita el usuario. */
export function TareaLecturaPage({ id }: { id: number }) {
	const router = useRouter();
	const navigate = useNavigate();
	const puedeVolver = useCanGoBack();
	const { puede } = usePermisos();
	const { data: tarea, error } = useTareaQuery(id);
	const eliminar = useEliminarTareaMutation();
	const duplicar = useDuplicarTareaMutation();
	const fijar = useFijarTareaMutation();
	const [moviendo, setMoviendo] = useState(false);
	const [eliminando, setEliminando] = useState(false);
	const [guardandoPlantilla, setGuardandoPlantilla] = useState(false);
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
				detalles={<DetallesTarea tarea={tarea} />}
				pie={
					<div className="space-y-8">
						<ChecklistSubtareas tarea={tarea} />
						<ComentariosTarea tarea={tarea} />
						<ActividadTarea tareaId={tarea.id} />
					</div>
				}
				acciones={
					<>
						<BotonCompletar tarea={tarea} />
						{puede("tareas:actualizar") && (
							<Button
								variant="outline"
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
						{puede("tareas:actualizar") && (
							<Button
								variant="ghost"
								size="sm"
								isLoading={fijar.isPending}
								aria-pressed={tarea.isFijada}
								aria-label={tarea.isFijada ? "Desfijar" : "Fijar"}
								title={tarea.isFijada ? "Desfijar" : "Fijar"}
								onClick={() =>
									fijar.mutate({ id: tarea.id, isFijada: !tarea.isFijada })
								}
							>
								{tarea.isFijada ? (
									<PinOff className="h-4 w-4 text-indigo-400" />
								) : (
									<Pin className="h-4 w-4" />
								)}
							</Button>
						)}
						<MenuAcciones
							acciones={[
								puede("tareas:crear") && {
									etiqueta: "Duplicar",
									icono: Copy,
									onClick: () =>
										duplicar.mutate(tarea.id, {
											onSuccess: (copia) =>
												navigate({
													to: "/tareas/$id",
													params: { id: String(copia.id) },
												}),
										}),
								},
								puede("tareas:crear") && {
									etiqueta: "Guardar como plantilla",
									icono: LayoutTemplate,
									onClick: () => setGuardandoPlantilla(true),
								},
								tarea.organizacionId === null &&
									puede("tareas:actualizar") && {
										etiqueta: "Mover a una organización",
										icono: FolderInput,
										onClick: () => setMoviendo(true),
									},
								puede("tareas:eliminar") && {
									etiqueta: "Eliminar",
									icono: Trash2,
									peligrosa: true,
									onClick: () => setEliminando(true),
								},
							]}
						/>
					</>
				}
			/>
			<MoverTareaDialog
				tarea={tarea}
				abierto={moviendo}
				onCerrar={() => setMoviendo(false)}
				onMovida={() => setMoviendo(false)}
			/>
			<GuardarPlantillaDialog
				tarea={tarea}
				abierto={guardandoPlantilla}
				onCerrar={() => setGuardandoPlantilla(false)}
			/>
			<ConfirmDialog
				abierto={eliminando}
				titulo="¿Eliminar tarea?"
				mensaje="Irá a la papelera, donde podrás restaurarla durante 30 días."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setEliminando(false)}
				onConfirmar={() => eliminar.mutate(id, { onSuccess: volver })}
			/>
		</>
	);
}
