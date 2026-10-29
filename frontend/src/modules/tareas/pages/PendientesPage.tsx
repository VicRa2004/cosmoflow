import { useNavigate } from "@tanstack/react-router";
import { Circle, CircleCheck, ListTodo, Plus } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/core/auth/store";
import { usePermisos } from "@/core/auth/usePermisos";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { Badge } from "@/core/components/ui/Badge";
import { Button } from "@/core/components/ui/Button";
import { EmptyState } from "@/core/components/ui/EmptyState";
import { type Columna, Tabla } from "@/core/components/ui/Table";
import type { TareaDto } from "../api/tareasApi";
import { TagsBadges } from "@/modules/tags/components/TagsBadges";
import { VencimientoTarea } from "../components/celdas";
import { TareaLectura } from "../components/TareaLectura";
import { useActualizarTareaMutation } from "../hooks/useTareasMutation";
import { usePendientesQuery } from "../hooks/useTareasQuery";
import { ETIQUETAS_ESTADO } from "../schemas/tareaSchemas";

/** Portada: lo que queda por hacer, lo que vence antes primero (RN-43). */
export function PendientesPage() {
	const nombre = useAuthStore((state) => state.usuario?.nombre);
	const { puede } = usePermisos();
	const [pagina, setPagina] = useState(1);
	const navigate = useNavigate();
	const [leyendo, setLeyendo] = useState<TareaDto | null>(null);
	const { data, isLoading, error } = usePendientesQuery(pagina);
	const actualizar = useActualizarTareaMutation();

	const columnas: Columna<TareaDto>[] = [
		{
			cabecera: <span className="sr-only">Completar</span>,
			className: "w-10",
			celda: (fila) => {
				const completando =
					actualizar.isPending && actualizar.variables?.id === fila.id;
				return (
					<button
						type="button"
						aria-label={`Completar «${fila.titulo}»`}
						disabled={completando}
						onClick={() =>
							actualizar.mutate({
								id: fila.id,
								datos: { estado: "completada" },
							})
						}
						className="group rounded-full text-tinta-tenue hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-50"
					>
						<Circle className="h-5 w-5 group-hover:hidden" />
						<CircleCheck className="hidden h-5 w-5 group-hover:block" />
					</button>
				);
			},
		},
		{
			cabecera: "Tarea",
			celda: (fila) => (
				<button
					type="button"
					onClick={() => setLeyendo(fila)}
					className="text-left font-medium text-tinta hover:text-indigo-400 hover:underline"
				>
					{fila.titulo}
				</button>
			),
		},
		{
			cabecera: "Vence",
			celda: (fila) => <VencimientoTarea tarea={fila} />,
		},
		{
			cabecera: "Estado",
			celda: (fila) =>
				fila.estado === "en_progreso" && (
					<Badge variant="purple">{ETIQUETAS_ESTADO[fila.estado]}</Badge>
				),
		},
		{
			cabecera: "Prioridad",
			celda: (fila) =>
				fila.prioridad === "alta" && <Badge variant="danger">Alta</Badge>,
		},
		{
			cabecera: "Tags",
			celda: (fila) => (
				<TagsBadges tagIds={fila.tagIds} organizacionId={fila.organizacionId} />
			),
		},
	];

	return (
		<div className="space-y-6">
			<EncabezadoPagina
				titulo="Pendientes"
				descripcion={
					<>
						{nombre ? `Hola, ${nombre}. ` : ""}
						{data?.totalElementos
							? `Tienes ${data.totalElementos} ${data.totalElementos === 1 ? "tarea abierta" : "tareas abiertas"}.`
							: ""}
					</>
				}
			>
				{puede("tareas:crear") && (
					<Button onClick={() => navigate({ to: "/tareas/nueva" })}>
						<Plus className="h-4 w-4" />
						Nueva tarea
					</Button>
				)}
			</EncabezadoPagina>

			<Tabla
				etiqueta="Tareas pendientes"
				columnas={columnas}
				datos={data}
				clave={(fila) => fila.id}
				onCambioPagina={setPagina}
				isLoading={isLoading}
				error={error}
				vacio={
					<EmptyState
						icono={ListTodo}
						titulo="Nada pendiente"
						descripcion="Crea una tarea y aparecerá aquí, ordenada por vencimiento."
					/>
				}
			/>

			<TareaLectura
				tarea={leyendo}
				onCerrar={() => setLeyendo(null)}
				onEditar={(tarea) =>
					navigate({ to: "/tareas/$id", params: { id: String(tarea.id) } })
				}
			/>
		</div>
	);
}
