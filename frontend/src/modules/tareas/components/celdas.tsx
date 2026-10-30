import { UserPlus } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import { useMiembrosQuery } from "@/modules/organizaciones/hooks/useMiembros";
import { useNombresContexto } from "@/modules/organizaciones/hooks/useNombresContexto";
import type { TareaDto } from "../api/tareasApi";
import { useDestinosTareas } from "../hooks/useDestinosTareas";

/** Una tarea con organización: compartida. */
type TareaCompartida = TareaDto & { organizacionId: number };
export const esCompartida = (tarea: TareaDto): tarea is TareaCompartida =>
	tarea.organizacionId !== null;

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

/** «Organización · Equipo»: dónde está una tarea compartida. */
export function DondeTarea({ tarea }: { tarea: TareaCompartida }) {
	const { organizacion, grupo } = useNombresContexto(tarea);
	return (
		<span className="text-tinta-suave">
			{[organizacion, grupo].filter(Boolean).join(" · ") || "…"}
		</span>
	);
}

/** Nombres de los responsables, o «Sin asignar». */
export function ResponsablesTarea({ tarea }: { tarea: TareaCompartida }) {
	const { data: miembros = [] } = useMiembrosQuery(tarea.organizacionId);
	if (tarea.responsableIds.length === 0) {
		return <span className="text-tinta-tenue">Sin asignar</span>;
	}
	const nombres = tarea.responsableIds.map(
		(id) => miembros.find((m) => m.usuarioId === id)?.nombre ?? "…",
	);
	return <span className="text-tinta-suave">{nombres.join(", ")}</span>;
}

/** Botón «Asignar», solo si se puede asignar en su destino (RN-22). */
export function AccionAsignar({
	tarea,
	onAsignar,
}: {
	tarea: TareaCompartida;
	onAsignar: (tarea: TareaCompartida) => void;
}) {
	const { puedeCrearEn } = useDestinosTareas(tarea.organizacionId);
	if (!puedeCrearEn(tarea)) return null;
	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={() => onAsignar(tarea)}
			aria-label="Asignar"
		>
			<UserPlus className="h-4 w-4" />
		</Button>
	);
}
