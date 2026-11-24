import { useNavigate } from "@tanstack/react-router";
import {
	Building2,
	FolderKanban,
	ListTodo,
	type LucideIcon,
	Plus,
	StickyNote,
	Tag,
	Users,
} from "lucide-react";
import {
	type Dispatch,
	type SetStateAction,
	useEffect,
	useId,
	useState,
} from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Dialog } from "@/core/components/ui/Dialog";
import { Input } from "@/core/components/ui/Input";
import { cn } from "@/core/utils/cn";
import { normalizar } from "@/core/utils/normalizar";
import { useBusquedaQuery } from "@/modules/busqueda/hooks/useBusquedaQuery";
import { useOrganizacionesQuery } from "@/modules/organizaciones/hooks/useOrganizacionesQuery";

interface Comando {
	id: string;
	etiqueta: string;
	icono: LucideIcon;
	ejecutar: () => void;
}

/**
 * Ctrl+K (⌘K): salta a tareas, notas, tags u organizaciones, o crea tareas, notas y tags.
 * Desde 2 caracteres busca también en tareas, notas, proyectos y equipos (búsqueda global).
 */
export function PaletaComandos({
	abierta,
	setAbierta,
}: {
	abierta: boolean;
	setAbierta: Dispatch<SetStateAction<boolean>>;
}) {
	useEffect(() => {
		const onTecla = (e: KeyboardEvent) => {
			if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "k") return;
			e.preventDefault();
			setAbierta((a) => !a);
		};
		// En captura: gana al atajo de enlace del editor markdown.
		window.addEventListener("keydown", onTecla, true);
		return () => window.removeEventListener("keydown", onTecla, true);
	}, [setAbierta]);

	return (
		<Dialog abierto={abierta} onCerrar={() => setAbierta(false)} titulo="Ir a…">
			<ListaComandos onElegido={() => setAbierta(false)} />
		</Dialog>
	);
}

function ListaComandos({ onElegido }: { onElegido: () => void }) {
	const navigate = useNavigate();
	const { puede } = usePermisos();
	const [texto, setTexto] = useState("");
	const [activo, setActivo] = useState(0);
	const idLista = useId();
	const verOrganizaciones = puede("organizaciones:leer");
	const { data: organizaciones } = useOrganizacionesQuery({
		pagina: 1,
		limite: 8,
		nombre: texto.trim() || undefined,
		orden: "recientes",
	});
	// El backend exige los tres permisos de lectura (los mismos que los listados).
	const buscarTodo =
		puede("tareas:leer") && puede("notas:leer") && verOrganizaciones;
	const { data: busqueda } = useBusquedaQuery(texto, buscarTodo);
	// Con menos de 2 caracteres no hay búsqueda: no arrastrar los resultados anteriores.
	const resultados =
		buscarTodo && texto.trim().length >= 2 ? busqueda : undefined;

	const fijos: (Comando & { visible: boolean })[] = [
		{
			id: "tareas",
			etiqueta: "Ver tareas",
			icono: ListTodo,
			visible: puede("tareas:leer"),
			ejecutar: () => navigate({ to: "/tareas" }),
		},
		{
			id: "nueva-tarea",
			etiqueta: "Nueva tarea",
			icono: Plus,
			visible: puede("tareas:crear"),
			ejecutar: () => navigate({ to: "/tareas/nueva" }),
		},
		{
			id: "notas",
			etiqueta: "Ver notas",
			icono: StickyNote,
			visible: puede("notas:leer"),
			ejecutar: () => navigate({ to: "/notas" }),
		},
		{
			id: "nueva-nota",
			etiqueta: "Nueva nota",
			icono: Plus,
			visible: puede("notas:crear"),
			ejecutar: () => navigate({ to: "/notas/nueva" }),
		},
		{
			id: "tags",
			etiqueta: "Ver tags",
			icono: Tag,
			visible: puede("tags:leer"),
			ejecutar: () => navigate({ to: "/tags" }),
		},
		{
			id: "nuevo-tag",
			etiqueta: "Nuevo tag",
			icono: Plus,
			visible: puede("tags:crear"),
			ejecutar: () => navigate({ to: "/tags", search: { nuevo: true } }),
		},
		{
			id: "organizaciones",
			etiqueta: "Ver organizaciones",
			icono: Building2,
			visible: verOrganizaciones,
			ejecutar: () => navigate({ to: "/organizaciones" }),
		},
	];
	const filtro = normalizar(texto.trim());
	const comandos: Comando[] = [
		...fijos.filter(
			(c) => c.visible && normalizar(c.etiqueta).includes(filtro),
		),
		// Ya filtradas por nombre en el backend.
		...(verOrganizaciones ? (organizaciones?.datos ?? []) : []).map((o) => ({
			id: `organizacion-${o.id}`,
			etiqueta: o.nombre,
			icono: Building2,
			ejecutar: () =>
				navigate({ to: "/organizaciones/$id", params: { id: String(o.id) } }),
		})),
		...(resultados?.tareas ?? []).map((t) => ({
			id: `tarea-${t.id}`,
			etiqueta: t.titulo,
			icono: ListTodo,
			ejecutar: () =>
				navigate({ to: "/tareas/$id", params: { id: String(t.id) } }),
		})),
		...(resultados?.notas ?? []).map((n) => ({
			id: `nota-${n.id}`,
			etiqueta: n.titulo,
			icono: StickyNote,
			ejecutar: () =>
				navigate({ to: "/notas/$id", params: { id: String(n.id) } }),
		})),
		...(resultados?.proyectos ?? []).map((p) => ({
			id: `proyecto-${p.id}`,
			etiqueta: p.nombre,
			icono: FolderKanban,
			ejecutar: () =>
				navigate({
					to: "/tareas",
					search: { organizacionId: p.organizacionId, proyectoId: p.id },
				}),
		})),
		...(resultados?.equipos ?? []).map((e) => ({
			id: `equipo-${e.id}`,
			etiqueta: e.nombre,
			icono: Users,
			ejecutar: () =>
				navigate({
					to: "/organizaciones/$id/equipos/$equipoId",
					params: { id: String(e.organizacionId), equipoId: String(e.id) },
				}),
		})),
	];
	const indice = Math.min(activo, comandos.length - 1);

	const elegir = (comando: Comando | undefined) => {
		if (!comando) return;
		onElegido();
		comando.ejecutar();
	};

	return (
		<div className="space-y-3">
			<Input
				// `showModal()` enfoca el primer control con el atributo `autofocus`
				// (sin él, la X); el `autoFocus` de React no lo pinta en el DOM.
				ref={(input) => input?.setAttribute("autofocus", "")}
				role="combobox"
				aria-label="Buscar comandos, tareas, notas, proyectos, equipos u organizaciones"
				aria-expanded
				aria-controls={idLista}
				aria-activedescendant={
					comandos[indice] ? `${idLista}-${comandos[indice].id}` : undefined
				}
				placeholder="Buscar tareas, notas, proyectos, equipos…"
				value={texto}
				onChange={(e) => {
					setTexto(e.target.value);
					setActivo(0);
				}}
				onKeyDown={(e) => {
					if (
						(e.key === "ArrowDown" || e.key === "ArrowUp") &&
						comandos.length > 0
					) {
						e.preventDefault();
						const paso = e.key === "ArrowDown" ? 1 : -1;
						setActivo((indice + paso + comandos.length) % comandos.length);
					} else if (e.key === "Enter") {
						e.preventDefault();
						elegir(comandos[indice]);
					}
				}}
			/>
			<div id={idLista} role="listbox" className="max-h-80 overflow-y-auto">
				{comandos.map((comando, i) => (
					// biome-ignore lint/a11y/useKeyWithClickEvents: el teclado se maneja desde el input (combobox)
					<div
						key={comando.id}
						tabIndex={-1}
						id={`${idLista}-${comando.id}`}
						role="option"
						aria-selected={i === indice}
						onClick={() => elegir(comando)}
						onMouseMove={() => setActivo(i)}
						className={cn(
							"flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 text-sm text-tinta-suave",
							i === indice && "bg-elevada text-tinta",
						)}
					>
						<comando.icono aria-hidden className="size-4 text-tinta-tenue" />
						<span className="truncate">{comando.etiqueta}</span>
					</div>
				))}
				{comandos.length === 0 && (
					<p className="px-2 py-6 text-center text-sm text-tinta-tenue">
						Sin resultados
					</p>
				)}
			</div>
		</div>
	);
}
