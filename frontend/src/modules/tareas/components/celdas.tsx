import type { TareaDto } from "../api/tareasApi";

/** AAAA-MM-DD en hora local. */
const diaLocal = (fecha: Date) => fecha.toLocaleDateString("sv-SE");

/** "2026-11-15" → "15 nov 2026" (sin pasar por la zona horaria). */
export const formatearDia = (dia: string) =>
	new Date(`${dia}T00:00`).toLocaleDateString("es-ES", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

/** Vencimiento con aviso si está vencida o vence hoy/mañana y sigue abierta. */
export function VencimientoTarea({ tarea }: { tarea: TareaDto }) {
	const dia = tarea.fechaVencimiento;
	if (!dia) return <span className="text-tinta-tenue">Sin fecha</span>;

	const abierta =
		tarea.estado === "pendiente" || tarea.estado === "en_progreso";
	const hoy = new Date();
	const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

	if (abierta && dia < diaLocal(hoy)) {
		return (
			<span className="font-medium text-rose-400">
				{formatearDia(dia)} · vencida
			</span>
		);
	}
	if (abierta && dia === diaLocal(hoy)) {
		return <span className="font-medium text-amber-400">Hoy</span>;
	}
	if (abierta && dia === diaLocal(manana)) {
		return <span className="text-amber-400">Mañana</span>;
	}
	return <span>{formatearDia(dia)}</span>;
}
