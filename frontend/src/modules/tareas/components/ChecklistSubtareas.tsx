import { ListChecks } from "lucide-react";
import { usePermisos } from "@/core/auth/usePermisos";
import { cn } from "@/core/utils/cn";
import type { TareaDto } from "../api/tareasApi";
import { useActualizarTareaMutation } from "../hooks/useTareasMutation";

/** Checklist interactiva de subtareas en la vista de lectura (#57). */
export function ChecklistSubtareas({ tarea }: { tarea: TareaDto }) {
	const { puede } = usePermisos();
	const actualizar = useActualizarTareaMutation();
	if (tarea.subtareas.length === 0) return null;

	const puedeEditar = puede("tareas:actualizar");
	const total = tarea.subtareas.length;
	const completadas = tarea.subtareas.filter((s) => s.completada).length;
	const porcentaje = Math.round((completadas / total) * 100);

	const alternar = (id: number) => {
		if (!puedeEditar || actualizar.isPending) return;
		actualizar.mutate({
			id: tarea.id,
			datos: {
				subtareas: tarea.subtareas.map((sub) => ({
					id: sub.id,
					titulo: sub.titulo,
					completada: sub.id === id ? !sub.completada : sub.completada,
				})),
			},
		});
	};

	return (
		<section aria-label="Subtareas" className="space-y-3">
			<div className="flex items-center justify-between gap-2">
				<h2 className="flex items-center gap-2 text-sm font-medium text-tinta">
					<ListChecks className="h-4 w-4 text-tinta-tenue" />
					Subtareas
				</h2>
				<span
					className={cn(
						"text-xs font-medium",
						completadas === total ? "text-emerald-400" : "text-tinta-tenue",
					)}
				>
					{completadas}/{total} ({porcentaje}%)
				</span>
			</div>
			<div className="h-1.5 w-full overflow-hidden rounded-full bg-elevada">
				<div
					className={cn(
						"h-full rounded-full transition-all",
						completadas === total ? "bg-emerald-500" : "bg-indigo-500",
					)}
					style={{ width: `${porcentaje}%` }}
				/>
			</div>
			<ul className="divide-y divide-borde rounded-lg border border-borde bg-superficie">
				{tarea.subtareas.map((sub) => (
					<li key={sub.id} className="flex items-center gap-2.5 px-3 py-2">
						<input
							type="checkbox"
							checked={sub.completada}
							disabled={!puedeEditar || actualizar.isPending}
							onChange={() => alternar(sub.id)}
							aria-label={sub.titulo}
							className="h-4 w-4 shrink-0 cursor-pointer rounded border border-borde-fuerte bg-superficie accent-indigo-600 disabled:cursor-default"
						/>
						<span
							className={cn(
								"text-sm",
								sub.completada ? "text-tinta-tenue line-through" : "text-tinta",
							)}
						>
							{sub.titulo}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}
