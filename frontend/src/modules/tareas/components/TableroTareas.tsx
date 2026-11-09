import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { getErrorMessage } from "@/core/api/client";
import { usePermisos } from "@/core/auth/usePermisos";
import { PuntoColor } from "@/core/components/ui/PuntoColor";
import { Spinner } from "@/core/components/ui/Spinner";
import { cn } from "@/core/utils/cn";
import {
	type EstadoTarea,
	type ObtenerTareasParams,
	type TareaDto,
} from "../api/tareasApi";
import { useActualizarTareaMutation } from "../hooks/useTareasMutation";
import { useTareasQuery } from "../hooks/useTareasQuery";
import { ETIQUETAS_ESTADO } from "../schemas/tareaSchemas";
import { PrioridadBadge, VencimientoTarea } from "./celdas";

const ESTADOS = Object.keys(ETIQUETAS_ESTADO) as EstadoTarea[];
// shortcut: el tablero carga las 200 primeras tareas, paginar por columna si un contexto pasa de ahí
const LIMITE = 200;

/**
 * Kanban: una columna por estado. Se cambia de estado arrastrando la tarjeta o,
 * con teclado y en táctil (sin arrastre nativo), con el selector de cada una.
 */
export function TableroTareas({
	filtros,
}: {
	/** Contexto, búsqueda y tag de la lista; el estado lo dan las columnas. */
	filtros: Omit<ObtenerTareasParams, "pagina" | "limite" | "estado">;
}) {
	const { puede } = usePermisos();
	const puedeMover = puede("tareas:actualizar");
	const { data, isLoading, error } = useTareasQuery({
		...filtros,
		pagina: 1,
		limite: LIMITE,
	});
	const actualizar = useActualizarTareaMutation();
	const [sobre, setSobre] = useState<EstadoTarea | null>(null);

	const mover = (tarea: TareaDto | undefined, estado: EstadoTarea) => {
		if (tarea && tarea.estado !== estado) {
			actualizar.mutate({ id: tarea.id, datos: { estado } });
		}
	};

	if (isLoading) return <Spinner />;
	if (error || !data) {
		return (
			<p role="alert" className="text-sm text-rose-400">
				{getErrorMessage(error)}
			</p>
		);
	}

	return (
		<div className="space-y-3">
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{ESTADOS.map((estado) => {
					const tareas = data.datos.filter((t) => t.estado === estado);
					return (
						<section
							key={estado}
							aria-label={ETIQUETAS_ESTADO[estado]}
							onDragOver={(e) => {
								// Sin `preventDefault` el navegador no permite soltar.
								e.preventDefault();
								setSobre(estado);
							}}
							onDragLeave={() => setSobre(null)}
							onDrop={(e) => {
								e.preventDefault();
								setSobre(null);
								const id = Number(e.dataTransfer.getData("text/plain"));
								mover(
									data.datos.find((t) => t.id === id),
									estado,
								);
							}}
							className={cn(
								"min-h-32 space-y-2 rounded-lg border border-borde bg-fondo p-2 transition-colors",
								sobre === estado && "border-indigo-500 bg-elevada",
							)}
						>
							<h2 className="flex items-center justify-between px-1 text-sm font-medium text-tinta">
								{ETIQUETAS_ESTADO[estado]}
								<span className="text-xs font-normal text-tinta-tenue">
									{tareas.length}
								</span>
							</h2>
							{tareas.map((tarea) => (
								<article
									key={tarea.id}
									draggable={puedeMover}
									onDragStart={(e) =>
										e.dataTransfer.setData("text/plain", String(tarea.id))
									}
									className={cn(
										"space-y-2 rounded-md border border-borde bg-superficie p-2.5 text-sm",
										puedeMover && "cursor-grab active:cursor-grabbing",
									)}
								>
									<Link
										to="/tareas/$id"
										params={{ id: String(tarea.id) }}
										// El enlace no debe arrastrarse en lugar de la tarjeta.
										draggable={false}
										className="flex items-center gap-2 font-medium text-tinta hover:text-indigo-400 hover:underline"
									>
										<PuntoColor color={tarea.color} />
										<span className="min-w-0 break-words">{tarea.titulo}</span>
									</Link>
									<div className="flex flex-wrap items-center gap-2 text-xs">
										<PrioridadBadge prioridad={tarea.prioridad} />
										{tarea.fechaVencimiento && (
											<VencimientoTarea tarea={tarea} />
										)}
									</div>
									{puedeMover && (
										<select
											aria-label={`Estado de «${tarea.titulo}»`}
											value={tarea.estado}
											disabled={actualizar.isPending}
											onChange={(e) =>
												mover(tarea, e.target.value as EstadoTarea)
											}
											className="h-7 w-full cursor-pointer rounded border border-borde bg-superficie px-1.5 text-xs text-tinta-suave focus:border-indigo-500 focus:outline-none"
										>
											{ESTADOS.map((valor) => (
												<option key={valor} value={valor}>
													{ETIQUETAS_ESTADO[valor]}
												</option>
											))}
										</select>
									)}
								</article>
							))}
						</section>
					);
				})}
			</div>
			{data.totalElementos > LIMITE && (
				<p className="text-xs text-tinta-tenue">
					Se muestran las {LIMITE} primeras de {data.totalElementos} tareas. Usa
					la búsqueda o la lista para ver el resto.
				</p>
			)}
		</div>
	);
}
