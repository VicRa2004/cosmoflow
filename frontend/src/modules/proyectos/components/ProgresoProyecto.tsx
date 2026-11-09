import { formatearDia } from "@/modules/tareas/components/celdas";
import type { ProyectoDto } from "../api/proyectosApi";

/** Fechas del proyecto y % de tareas completadas (las canceladas no cuentan). */
export function ProgresoProyecto({
	proyecto: { fechaInicio, fechaFin, progreso },
}: {
	proyecto: Pick<ProyectoDto, "fechaInicio" | "fechaFin" | "progreso">;
}) {
	const fechas =
		fechaInicio && fechaFin
			? `${formatearDia(fechaInicio)} – ${formatearDia(fechaFin)}`
			: fechaInicio
				? `Desde ${formatearDia(fechaInicio)}`
				: fechaFin && `Hasta ${formatearDia(fechaFin)}`;
	const { tareas, completadas } = progreso;
	if (!fechas && tareas === 0) return null;
	const porcentaje = tareas && Math.round((completadas / tareas) * 100);

	return (
		<div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tinta-tenue">
			{tareas > 0 && (
				<span className="flex items-center gap-2">
					<span
						role="progressbar"
						aria-label="Tareas completadas"
						aria-valuenow={porcentaje}
						aria-valuemin={0}
						aria-valuemax={100}
						className="h-1.5 w-24 overflow-hidden rounded-full bg-elevada"
					>
						<span
							className="block h-full bg-emerald-500"
							style={{ width: `${porcentaje}%` }}
						/>
					</span>
					{porcentaje}% · {completadas}/{tareas} tareas
				</span>
			)}
			{fechas && <span>{fechas}</span>}
		</div>
	);
}
