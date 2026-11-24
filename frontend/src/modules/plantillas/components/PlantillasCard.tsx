import { useNavigate } from "@tanstack/react-router";
import { FilePlus2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { PuntoColor } from "@/core/components/ui/PuntoColor";
import { Spinner } from "@/core/components/ui/Spinner";
import { ETIQUETAS_PRIORIDAD } from "@/modules/tareas/schemas/tareaSchemas";
import type { PlantillaTareaDto } from "../api/plantillasApi";
import {
	useEliminarPlantillaMutation,
	usePlantillasQuery,
} from "../hooks/usePlantillas";
import { EditarPlantillaDialog } from "./EditarPlantillaDialog";

/**
 * Plantillas personales o, con `organizacionId`, de la organización (las ven todos
 * sus miembros; con `plantillas:gestionar` se editan y borran). Se crean desde una tarea.
 */
export function PlantillasCard({
	organizacionId,
	puedeGestionar = true,
}: {
	organizacionId?: number;
	puedeGestionar?: boolean;
}) {
	const navigate = useNavigate();
	const { data: plantillas } = usePlantillasQuery(organizacionId);
	const eliminar = useEliminarPlantillaMutation(organizacionId);
	const [borrando, setBorrando] = useState<PlantillaTareaDto | null>(null);
	const [editando, setEditando] = useState<PlantillaTareaDto | null>(null);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Plantillas de tareas</CardTitle>
				<CardDescription>
					Para crear una, abre una tarea y pulsa «Guardar como plantilla».
					{organizacionId !== undefined &&
						" Las de la organización las pueden usar todos sus miembros."}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{!plantillas ? (
					<Spinner />
				) : plantillas.length === 0 ? (
					<p className="text-sm text-tinta-tenue">Aún no hay plantillas.</p>
				) : (
					<ul className="divide-y divide-borde">
						{plantillas.map((p) => (
							<li
								key={p.id}
								className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="min-w-0">
									<p className="flex items-center gap-2 font-medium text-tinta">
										<PuntoColor color={p.color} className="h-2 w-2" />
										{p.nombre}
									</p>
									<p className="truncate text-xs text-tinta-tenue">
										{p.titulo} · Prioridad{" "}
										{ETIQUETAS_PRIORIDAD[p.prioridad].toLowerCase()}
										{p.subtareas.length > 0 &&
											` · ${p.subtareas.length} subtarea${p.subtareas.length > 1 ? "s" : ""}`}
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											navigate({
												to: "/tareas/nueva",
												search: { organizacionId, plantillaId: p.id },
											})
										}
									>
										<FilePlus2 className="h-4 w-4" />
										Usar
									</Button>
									{puedeGestionar && (
										<>
											<Button
												variant="ghost"
												size="sm"
												aria-label={`Editar la plantilla ${p.nombre}`}
												onClick={() => setEditando(p)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="dangerGhost"
												size="sm"
												aria-label={`Eliminar la plantilla ${p.nombre}`}
												onClick={() => setBorrando(p)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</>
									)}
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>
			<EditarPlantillaDialog
				plantilla={editando}
				organizacionId={organizacionId}
				onCerrar={() => setEditando(null)}
			/>
			<ConfirmDialog
				abierto={borrando !== null}
				titulo={`¿Eliminar la plantilla «${borrando?.nombre ?? ""}»?`}
				mensaje="Las tareas creadas con ella no cambian. Esta acción no se puede deshacer."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setBorrando(null)}
				onConfirmar={() =>
					borrando &&
					eliminar.mutate(borrando.id, { onSuccess: () => setBorrando(null) })
				}
			/>
		</Card>
	);
}
