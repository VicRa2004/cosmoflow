import {
	CalendarClock,
	CalendarPlus,
	CircleDashed,
	Lock,
	type LucideIcon,
	Repeat,
	Signal,
	Tag,
	Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/core/components/ui/Avatar";
import { Badge } from "@/core/components/ui/Badge";
import { cn } from "@/core/utils/cn";
import { useMiembrosQuery } from "@/modules/organizaciones/hooks/useMiembros";
import { TagsBadges } from "@/modules/tags/components/TagsBadges";
import type { TareaDto } from "../api/tareasApi";
import {
	ETIQUETAS_ESTADO,
	ETIQUETAS_PRIORIDAD,
	ETIQUETAS_RECURRENCIA,
} from "../schemas/tareaSchemas";
import {
	formatearDia,
	IconoEstado,
	IconoPrioridad,
	VencimientoTarea,
} from "./celdas";

function Propiedad({
	icono: Icono,
	etiqueta,
	ancha,
	children,
}: {
	icono: LucideIcon;
	etiqueta: string;
	ancha?: boolean;
	children: ReactNode;
}) {
	return (
		<div className={cn("min-w-0", ancha && "col-span-full")}>
			<dt className="flex items-center gap-1.5 text-xs text-tinta-tenue">
				<Icono aria-hidden className="size-3.5" />
				{etiqueta}
			</dt>
			<dd className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-tinta">
				{children}
			</dd>
		</div>
	);
}

/** Cada responsable con su avatar; quién lo asignó, al pasar el ratón. */
function Responsables({
	tarea,
}: {
	tarea: TareaDto & { organizacionId: number };
}) {
	const { data: miembros = [] } = useMiembrosQuery(tarea.organizacionId);
	const miembro = (id: number) => miembros.find((m) => m.usuarioId === id);
	// Las asignaciones antiguas no guardan quién las hizo.
	const asignadoPor = (id: number) => {
		const por = tarea.asignadoPor[id];
		if (por === undefined) return undefined;
		if (por === id) return "Asignado por sí mismo";
		return `Asignado por ${miembro(por)?.nombre ?? "…"}`;
	};
	return tarea.responsableIds.map((id) => {
		const nombre = miembro(id)?.nombre ?? "…";
		return (
			<span
				key={id}
				title={asignadoPor(id)}
				className="inline-flex items-center gap-1.5"
			>
				<Avatar
					nombre={nombre}
					url={miembro(id)?.avatarUrl}
					className="size-6"
				/>
				{nombre}
			</span>
		);
	});
}

/** Propiedades de una tarea en su página de lectura. */
export function DetallesTarea({ tarea }: { tarea: TareaDto }) {
	return (
		<dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-borde bg-superficie p-4 sm:grid-cols-3">
			<Propiedad icono={CircleDashed} etiqueta="Estado">
				<span className="inline-flex items-center gap-1.5">
					<IconoEstado estado={tarea.estado} />
					{ETIQUETAS_ESTADO[tarea.estado]}
				</span>
				{tarea.bloqueada && (
					<Badge
						variant="warning"
						className="gap-1"
						title="Depende de una tarea sin completar"
					>
						<Lock aria-hidden className="size-3" />
						Bloqueada
					</Badge>
				)}
			</Propiedad>
			<Propiedad icono={Signal} etiqueta="Prioridad">
				<span className="inline-flex items-center gap-1.5">
					<IconoPrioridad prioridad={tarea.prioridad} />
					{ETIQUETAS_PRIORIDAD[tarea.prioridad]}
				</span>
			</Propiedad>
			<Propiedad icono={CalendarClock} etiqueta="Vence">
				<VencimientoTarea tarea={tarea} />
			</Propiedad>
			{tarea.fechaInicio && (
				<Propiedad icono={CalendarPlus} etiqueta="Inicio">
					{formatearDia(tarea.fechaInicio)}
				</Propiedad>
			)}
			{tarea.recurrencia && (
				<Propiedad icono={Repeat} etiqueta="Repetición">
					{ETIQUETAS_RECURRENCIA[tarea.recurrencia]}
				</Propiedad>
			)}
			{tarea.organizacionId !== null && tarea.responsableIds.length > 0 && (
				<Propiedad icono={Users} etiqueta="Responsables" ancha>
					<Responsables
						tarea={{ ...tarea, organizacionId: tarea.organizacionId }}
					/>
				</Propiedad>
			)}
			{tarea.tagIds.length > 0 && (
				<Propiedad icono={Tag} etiqueta="Tags" ancha>
					<TagsBadges
						tagIds={tarea.tagIds}
						organizacionId={tarea.organizacionId}
					/>
				</Propiedad>
			)}
		</dl>
	);
}
