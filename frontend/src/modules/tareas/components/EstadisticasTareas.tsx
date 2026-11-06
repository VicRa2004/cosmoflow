import { Card, CardHeader, CardTitle } from "@/core/components/ui/Card";
import { Spinner } from "@/core/components/ui/Spinner";
import { cn } from "@/core/utils/cn";
import type {
	DestinoTarea,
	EstadoTarea,
	PrioridadTarea,
} from "../api/tareasApi";
import { useEstadisticasTareasQuery } from "../hooks/useTareasQuery";
import { ETIQUETAS_ESTADO } from "../schemas/tareaSchemas";
import { PrioridadBadge } from "./celdas";

const COLOR_ESTADO: Record<EstadoTarea, string> = {
	pendiente: "bg-amber-400",
	en_progreso: "bg-indigo-500",
	completada: "bg-emerald-500",
	cancelada: "bg-borde-fuerte",
};
const PRIORIDADES: PrioridadTarea[] = ["alta", "media", "baja"];

function Cifra({
	valor,
	etiqueta,
	alerta = false,
}: {
	valor: number | string;
	etiqueta: string;
	alerta?: boolean;
}) {
	return (
		<div className="rounded-md border border-borde p-3">
			<p
				className={cn(
					"text-2xl font-semibold tabular-nums text-tinta",
					alerta && "text-rose-400",
				)}
			>
				{valor}
			</p>
			<p className="text-xs text-tinta-tenue">{etiqueta}</p>
		</div>
	);
}

/** Recuento de las tareas de una organización, equipo o proyecto. */
export function EstadisticasTareas({
	destino,
	titulo = "Tareas",
	nombres,
}: {
	destino: DestinoTarea;
	titulo?: string;
	/** Nombre de cada responsable por `usuarioId`. */
	nombres: Map<number, string>;
}) {
	const { data, isLoading, error } = useEstadisticasTareasQuery(destino);

	if (isLoading) {
		return (
			<Card className="flex justify-center text-tinta-tenue">
				<Spinner />
			</Card>
		);
	}
	if (error || !data) {
		return (
			<Card className="text-sm text-tinta-tenue">
				No se pudieron cargar las estadísticas.
			</Card>
		);
	}

	const { porEstado, total } = data;
	const abiertas = porEstado.pendiente + porEstado.en_progreso;
	const cerradas = porEstado.completada + porEstado.cancelada;
	const avance = cerradas
		? Math.round((porEstado.completada / cerradas) * 100)
		: 0;
	const estados = Object.keys(porEstado) as EstadoTarea[];

	return (
		<Card className="space-y-5">
			<CardHeader className="pb-0">
				<CardTitle>{titulo}</CardTitle>
				<p className="text-sm text-tinta-tenue">
					{total} {total === 1 ? "tarea" : "tareas"} en total.
				</p>
			</CardHeader>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<Cifra valor={abiertas} etiqueta="Abiertas" />
				<Cifra valor={porEstado.completada} etiqueta="Completadas" />
				<Cifra
					valor={data.vencidas}
					etiqueta="Vencidas"
					alerta={data.vencidas > 0}
				/>
				<Cifra valor={`${avance}%`} etiqueta="Completadas de las cerradas" />
			</div>

			{total > 0 && (
				<div className="space-y-2">
					<div
						aria-hidden
						className="flex h-2 overflow-hidden rounded-full bg-elevada"
					>
						{estados.map((e) => (
							<div
								key={e}
								className={COLOR_ESTADO[e]}
								style={{ width: `${(porEstado[e] / total) * 100}%` }}
							/>
						))}
					</div>
					<ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta-suave">
						{estados.map((e) => (
							<li key={e} className="flex items-center gap-1.5">
								<span className={cn("size-2 rounded-full", COLOR_ESTADO[e])} />
								{ETIQUETAS_ESTADO[e]}: {porEstado[e]}
							</li>
						))}
					</ul>
				</div>
			)}

			<div className="grid gap-5 sm:grid-cols-2">
				<section className="space-y-2">
					<h4 className="text-[13px] font-medium text-tinta-suave">
						Abiertas por prioridad
					</h4>
					<ul className="space-y-1.5 text-sm">
						{PRIORIDADES.map((p) => (
							<li key={p} className="flex items-center justify-between">
								<PrioridadBadge prioridad={p} />
								<span className="tabular-nums text-tinta">
									{data.abiertasPorPrioridad[p]}
								</span>
							</li>
						))}
					</ul>
				</section>
				<section className="space-y-2">
					<h4 className="text-[13px] font-medium text-tinta-suave">
						Por responsable (abiertas / completadas)
					</h4>
					{data.porResponsable.length ? (
						<ul className="space-y-1.5 text-sm">
							{data.porResponsable.map((r) => (
								<li key={r.usuarioId} className="flex justify-between gap-2">
									<span className="truncate text-tinta">
										{nombres.get(r.usuarioId) ?? "Antiguo miembro"}
									</span>
									<span className="shrink-0 tabular-nums text-tinta-suave">
										{r.abiertas} / {r.completadas}
									</span>
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm text-tinta-tenue">
							Sin responsables asignados.
						</p>
					)}
				</section>
			</div>
		</Card>
	);
}
