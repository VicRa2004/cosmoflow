import {
	AtSign,
	Bell,
	CalendarClock,
	CalendarDays,
	type LucideIcon,
	MessageSquare,
	RefreshCw,
	UserPlus,
} from "lucide-react";
import { useAuthStore } from "@/core/auth/store";
import { cn } from "@/core/utils/cn";
import type { NotificacionApp } from "../api/notificacionesApi";
import {
	describirResponsables,
	ETIQUETAS_EVENTO,
} from "../utils/describirNotificacion";

const ICONOS: Record<NonNullable<NotificacionApp["evento"]>, LucideIcon> = {
	tareaAsignada: UserPlus,
	mencion: AtSign,
	comentario: MessageSquare,
	estadoCambiado: RefreshCw,
	vencimiento: CalendarClock,
	resumenDiario: CalendarDays,
};

const formatoRelativo = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

function tiempoRelativo(iso: string): string {
	const segundos = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
	const abs = Math.abs(segundos);
	if (abs < 60) return "ahora";
	if (abs < 3600)
		return formatoRelativo.format(Math.round(segundos / 60), "minute");
	if (abs < 86_400)
		return formatoRelativo.format(Math.round(segundos / 3600), "hour");
	return formatoRelativo.format(Math.round(segundos / 86_400), "day");
}

/** Qué es (icono y etiqueta), título de la tarea, encargado y quién asignó. */
export function ItemNotificacion({
	notificacion,
	onAbrir,
}: {
	notificacion: NotificacionApp;
	onAbrir: () => void;
}) {
	const yoId = useAuthStore((s) => s.usuario?.id);
	const { evento, actor, tarea, leida } = notificacion;
	const Icono = evento ? ICONOS[evento] : Bell;
	const etiqueta = evento ? ETIQUETAS_EVENTO[evento] : "Notificación";
	const responsables = tarea && describirResponsables(tarea.responsables, yoId);

	return (
		<button
			type="button"
			onClick={onAbrir}
			className={cn(
				"flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-elevada",
				!leida && "bg-indigo-950/20",
			)}
		>
			<span
				aria-hidden
				className={cn(
					"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-elevada",
					leida ? "text-tinta-tenue" : "text-indigo-400",
				)}
			>
				<Icono className="size-4" />
			</span>
			<div className="min-w-0 flex-1 space-y-1">
				<p className="flex items-center gap-1.5 text-xs text-tinta-tenue">
					<span className={cn("font-medium", !leida && "text-indigo-400")}>
						{etiqueta}
					</span>
					{actor && <span className="truncate">· {actor.nombre}</span>}
					<span className="ml-auto shrink-0">
						{tiempoRelativo(notificacion.createdAt)}
					</span>
				</p>
				<p
					className={cn(
						"line-clamp-2 text-sm",
						leida ? "text-tinta-suave" : "font-medium text-tinta",
					)}
				>
					{tarea?.titulo ?? notificacion.asunto}
				</p>
				{responsables && (
					<dl className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-tinta-tenue">
						<div className="flex gap-1">
							<dt>Encargado:</dt>
							<dd className="text-tinta-suave">{responsables.encargado}</dd>
						</div>
						{responsables.asigno && (
							<div className="flex gap-1">
								<dt>Asignó:</dt>
								<dd className="text-tinta-suave">{responsables.asigno}</dd>
							</div>
						)}
					</dl>
				)}
			</div>
			{!leida && <span className="sr-only">Sin leer</span>}
		</button>
	);
}
