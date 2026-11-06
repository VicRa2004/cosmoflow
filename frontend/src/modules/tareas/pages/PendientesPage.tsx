import { useNavigate } from "@tanstack/react-router";
import { ListTodo } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/core/auth/store";
import {
	limiteOrganizacionesPendientes,
	usePreferenciasQuery,
} from "@/modules/configuracion/hooks/usePreferencias";
import { EncabezadoPagina } from "@/core/components/ui/EncabezadoPagina";
import { EmptyState } from "@/core/components/ui/EmptyState";
import { PuntoColor } from "@/core/components/ui/PuntoColor";
import { type Columna, Tabla } from "@/core/components/ui/Table";
import type { TareaDto } from "../api/tareasApi";
import { TagsBadges } from "@/modules/tags/components/TagsBadges";
import {
	DondeTarea,
	esCompartida,
	InicioTarea,
	PrioridadBadge,
	VencimientoTarea,
} from "../components/celdas";
import { BotonCompletar } from "../components/BotonCompletar";
import { MenuNuevo } from "../components/MenuNuevo";
import { usePendientesQuery } from "../hooks/useTareasQuery";

/** Portada: lo que queda por hacer, lo que vence antes primero (RN-43). */
export function PendientesPage() {
	const nombre = useAuthStore((state) => state.usuario?.nombre);
	const [pagina, setPagina] = useState(1);
	const navigate = useNavigate();
	const { data, isLoading, error } = usePendientesQuery(pagina);
	const { data: preferencias } = usePreferenciasQuery();

	const columnas: Columna<TareaDto>[] = [
		{
			cabecera: "Tarea",
			celda: (fila) => (
				<button
					type="button"
					onClick={() =>
						navigate({ to: "/tareas/$id", params: { id: String(fila.id) } })
					}
					className="flex items-center gap-2 text-left font-medium text-tinta hover:text-indigo-400 hover:underline"
				>
					<PuntoColor color={fila.color} />
					{fila.titulo}
				</button>
			),
		},
		{
			cabecera: "Dónde",
			celda: (fila) =>
				esCompartida(fila) ? (
					<DondeTarea tarea={fila} />
				) : (
					<span className="text-tinta-tenue">Personal</span>
				),
		},
		{
			cabecera: "Inicio",
			celda: (fila) => <InicioTarea tarea={fila} />,
		},
		{
			cabecera: "Vence",
			celda: (fila) => <VencimientoTarea tarea={fila} />,
		},
		{
			cabecera: "Prioridad",
			celda: (fila) => <PrioridadBadge prioridad={fila.prioridad} />,
		},
		{
			cabecera: "Tags",
			celda: (fila) => (
				<TagsBadges tagIds={fila.tagIds} organizacionId={fila.organizacionId} />
			),
		},
		{
			cabecera: <span className="sr-only">Acción</span>,
			className: "text-right",
			celda: (fila) => <BotonCompletar tarea={fila} />,
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
				<MenuNuevo
					soloTareas={!preferencias?.pendientesNotas}
					organizaciones={limiteOrganizacionesPendientes(preferencias)}
				/>
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
		</div>
	);
}
