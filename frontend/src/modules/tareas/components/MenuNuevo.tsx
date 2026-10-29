import { Link } from "@tanstack/react-router";
import {
	Building2,
	ChevronDown,
	FolderKanban,
	ListTodo,
	NotebookPen,
	Plus,
	Users,
} from "lucide-react";
import { type ReactNode, useRef } from "react";
import { useAuthStore } from "@/core/auth/store";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { useEquiposQuery } from "@/modules/equipos/hooks/useEquipos";
import { useOrganizacionesQuery } from "@/modules/organizaciones/hooks/useOrganizacionesQuery";
import { useProyectosQuery } from "@/modules/proyectos/hooks/useProyectos";

const ID = "menu-nuevo";
const opcion =
	"flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-sm text-tinta-suave transition-colors hover:bg-elevada hover:text-tinta";
const icono = "size-4 shrink-0 text-tinta-tenue";

interface Permisos {
	tareas: boolean;
	notas: boolean;
	cerrar: () => void;
}

function Opcion({
	to,
	search,
	children,
	cerrar,
}: {
	to: "/tareas/nueva" | "/notas/nueva";
	search: Record<string, number>;
	children: ReactNode;
	cerrar: () => void;
}) {
	return (
		<Link to={to} search={search} onClick={cerrar} className={opcion}>
			{children}
		</Link>
	);
}

/** Destinos de una organización donde quien pide puede crear (RN-22, RN-33). */
function OpcionesOrganizacion({
	organizacionId,
	nombre,
	tareas,
	notas,
	cerrar,
}: Permisos & { organizacionId: number; nombre: string }) {
	const yo = useAuthStore((s) => s.usuario?.id);
	const { data: equipos = [] } = useEquiposQuery(organizacionId);
	const { data: proyectos = [] } = useProyectosQuery(organizacionId);
	// Mismo criterio que el backend: sin líder, cualquier miembro; si no, líder o delegado.
	const misEquipos = equipos.filter((e) =>
		e.miembros.some(
			(m) =>
				m.usuarioId === yo &&
				(e.liderId === null || e.liderId === yo || m.puedeCrearTareas),
		),
	);
	const miembroDe = new Set(
		equipos
			.filter((e) => e.miembros.some((m) => m.usuarioId === yo))
			.map((e) => e.id),
	);
	const misProyectos = proyectos.filter(
		(p) =>
			(yo !== undefined && p.integranteIds.includes(yo)) ||
			p.equipoIds.some((id) => miembroDe.has(id)),
	);

	return (
		<>
			<hr className="-mx-1.5 my-1 border-borde" />
			<p className="truncate px-2 pt-1 pb-1 text-xs font-medium text-tinta-tenue">
				{nombre}
			</p>
			{tareas && (
				<Opcion to="/tareas/nueva" search={{ organizacionId }} cerrar={cerrar}>
					<Building2 aria-hidden className={icono} />
					Tarea de la organización
				</Opcion>
			)}
			{tareas &&
				misEquipos.map((e) => (
					<Opcion
						key={`e${e.id}`}
						to="/tareas/nueva"
						search={{ organizacionId, equipoId: e.id }}
						cerrar={cerrar}
					>
						<Users aria-hidden className={icono} />
						<span className="truncate">Tarea en {e.nombre}</span>
					</Opcion>
				))}
			{misProyectos.flatMap((p) => [
				tareas && (
					<Opcion
						key={`pt${p.id}`}
						to="/tareas/nueva"
						search={{ organizacionId, proyectoId: p.id }}
						cerrar={cerrar}
					>
						<FolderKanban aria-hidden className={icono} />
						<span className="truncate">Tarea en {p.nombre}</span>
					</Opcion>
				),
				notas && (
					<Opcion
						key={`pn${p.id}`}
						to="/notas/nueva"
						search={{ organizacionId, proyectoId: p.id }}
						cerrar={cerrar}
					>
						<NotebookPen aria-hidden className={icono} />
						<span className="truncate">Nota en {p.nombre}</span>
					</Opcion>
				),
			])}
		</>
	);
}

/** «Nueva» con todos los destinos a un clic: personal, organización, equipo o proyecto. */
export function MenuNuevo() {
	const { puede } = usePermisos();
	const menu = useRef<HTMLDivElement>(null);
	const cerrar = () => menu.current?.hidePopover();
	// shortcut: solo 10 organizaciones (por nombre) para no disparar peticiones de equipos y proyectos; ordenar por uso reciente si se queda corto.
	const { data: organizaciones } = useOrganizacionesQuery({
		pagina: 1,
		limite: 10,
	});
	const permisos = {
		tareas: puede("tareas:crear"),
		notas: puede("notas:crear"),
		cerrar,
	};
	if (!permisos.tareas && !permisos.notas) return null;

	return (
		<>
			<Button popoverTarget={ID} className="[anchor-name:--menu-nuevo]">
				<Plus className="h-4 w-4" />
				Nueva
				<ChevronDown className="h-4 w-4" />
			</Button>
			<div
				ref={menu}
				id={ID}
				popover="auto"
				// Anclado al botón (anchor positioning); sin soporte, cae arriba a la derecha.
				className="inset-auto top-[anchor(bottom)] right-[anchor(right)] m-0 mt-1 max-h-[70vh] w-72 overflow-y-auto rounded-lg border border-borde bg-superficie p-1.5 text-tinta shadow-flotante [position-anchor:--menu-nuevo]"
			>
				<p className="px-2 pt-1 pb-1 text-xs font-medium text-tinta-tenue">
					Personal
				</p>
				{permisos.tareas && (
					<Opcion to="/tareas/nueva" search={{}} cerrar={cerrar}>
						<ListTodo aria-hidden className={icono} />
						Tarea personal
					</Opcion>
				)}
				{permisos.notas && (
					<Opcion to="/notas/nueva" search={{}} cerrar={cerrar}>
						<NotebookPen aria-hidden className={icono} />
						Nota personal
					</Opcion>
				)}
				{organizaciones?.datos.map((o) => (
					<OpcionesOrganizacion
						key={o.id}
						organizacionId={o.id}
						nombre={o.nombre}
						{...permisos}
					/>
				))}
			</div>
		</>
	);
}
