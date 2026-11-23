import {
	Circle,
	CircleCheck,
	CircleDot,
	CircleX,
	ListChecks,
	Lock,
	type LucideIcon,
	Repeat,
	SignalHigh,
	SignalLow,
	SignalMedium,
	UserPlus,
} from "lucide-react";
import { Badge, type BadgeProps } from "@/core/components/ui/Badge";
import { Button } from "@/core/components/ui/Button";
import { cn } from "@/core/utils/cn";
import { useMiembrosQuery } from "@/modules/organizaciones/hooks/useMiembros";
import { useNombresContexto } from "@/modules/organizaciones/hooks/useNombresContexto";
import type { EstadoTarea, PrioridadTarea, TareaDto } from "../api/tareasApi";
import { useDestinosTareas } from "../hooks/useDestinosTareas";
import {
	ETIQUETAS_ESTADO,
	ETIQUETAS_PRIORIDAD,
	ETIQUETAS_RECURRENCIA,
} from "../schemas/tareaSchemas";
import { diaLocal } from "../utils/calendario";

const VARIANTE_ESTADO: Record<EstadoTarea, BadgeProps["variant"]> = {
	pendiente: "default",
	en_progreso: "purple",
	completada: "success",
	cancelada: "warning",
};

const VARIANTE_PRIORIDAD: Record<PrioridadTarea, BadgeProps["variant"]> = {
	baja: "default",
	media: "warning",
	alta: "danger",
};

const ICONO_ESTADO: Record<EstadoTarea, [LucideIcon, string]> = {
	pendiente: [Circle, "text-tinta-tenue"],
	en_progreso: [CircleDot, "text-indigo-400"],
	completada: [CircleCheck, "text-emerald-400"],
	cancelada: [CircleX, "text-amber-400"],
};

const ICONO_PRIORIDAD: Record<PrioridadTarea, [LucideIcon, string]> = {
	baja: [SignalLow, "text-tinta-tenue"],
	media: [SignalMedium, "text-amber-400"],
	alta: [SignalHigh, "text-rose-400"],
};

export function IconoEstado({ estado }: { estado: EstadoTarea }) {
	const [Icono, color] = ICONO_ESTADO[estado];
	return <Icono aria-hidden className={cn("size-4 shrink-0", color)} />;
}

export function IconoPrioridad({ prioridad }: { prioridad: PrioridadTarea }) {
	const [Icono, color] = ICONO_PRIORIDAD[prioridad];
	return <Icono aria-hidden className={cn("size-4 shrink-0", color)} />;
}

export const EstadoBadge = ({ estado }: { estado: EstadoTarea }) => (
	<Badge variant={VARIANTE_ESTADO[estado]}>{ETIQUETAS_ESTADO[estado]}</Badge>
);

export const PrioridadBadge = ({
	prioridad,
}: {
	prioridad: PrioridadTarea;
}) => (
	<Badge variant={VARIANTE_PRIORIDAD[prioridad]}>
		{ETIQUETAS_PRIORIDAD[prioridad]}
	</Badge>
);

/** Una tarea con organización: compartida. */
type TareaCompartida = TareaDto & { organizacionId: number };
export const esCompartida = (tarea: TareaDto): tarea is TareaCompartida =>
	tarea.organizacionId !== null;

/** "2026-11-15" → "15 nov 2026" (sin pasar por la zona horaria). */
export const formatearDia = (dia: string) =>
	new Date(`${dia}T00:00`).toLocaleDateString("es-ES", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

/** Fecha de inicio, o «Sin fecha». */
export const InicioTarea = ({ tarea }: { tarea: TareaDto }) =>
	tarea.fechaInicio ? (
		<span>{formatearDia(tarea.fechaInicio)}</span>
	) : (
		<span className="text-tinta-tenue">Sin fecha</span>
	);

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
	const nombre = (id: number) =>
		miembros.find((m) => m.usuarioId === id)?.nombre ?? "…";
	const nombres = tarea.responsableIds.map(nombre);
	// Quién asignó a cada uno, al pasar el ratón (las asignaciones antiguas no lo tienen).
	const asignaciones = tarea.responsableIds.flatMap((id) => {
		const por = tarea.asignadoPor[id];
		return por === undefined
			? []
			: [`${nombre(id)}: asignado por ${nombre(por)}`];
	});
	return (
		<span
			className="text-tinta-suave"
			title={asignaciones.join("\n") || undefined}
		>
			{nombres.join(", ")}
		</span>
	);
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

/** Candado si depende de una tarea aún sin completar. */
export const BloqueadaIcono = ({ tarea }: { tarea: TareaDto }) =>
	tarea.bloqueada && (
		<Lock
			className="h-3.5 w-3.5 shrink-0 text-amber-400"
			aria-label="Bloqueada: depende de una tarea sin completar"
		>
			<title>Bloqueada: depende de una tarea sin completar</title>
		</Lock>
	);

/** Icono si la tarea es recurrente (#57). */
export const RecurrenciaIcono = ({ tarea }: { tarea: TareaDto }) =>
	tarea.recurrencia && (
		<Repeat
			className="h-3.5 w-3.5 shrink-0 text-indigo-400"
			aria-label={`Se repite: ${ETIQUETAS_RECURRENCIA[tarea.recurrencia].toLowerCase()}`}
		>
			<title>
				Se repite: {ETIQUETAS_RECURRENCIA[tarea.recurrencia].toLowerCase()}
			</title>
		</Repeat>
	);

/** Progreso de subtareas (`completadas/total`), solo si la tarea tiene subtareas (#57). */
export function ProgresoSubtareas({ tarea }: { tarea: TareaDto }) {
	const total = tarea.subtareas.length;
	if (total === 0) return null;
	const completadas = tarea.subtareas.filter((s) => s.completada).length;
	const completas = completadas === total;
	return (
		<span
			title={`${completadas} de ${total} subtareas completadas`}
			className={cn(
				"inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium",
				completas
					? "bg-emerald-950/50 text-emerald-400"
					: "bg-elevada text-tinta-tenue",
			)}
		>
			<ListChecks className="h-3 w-3" />
			{completadas}/{total}
		</span>
	);
}
