import { Select } from "@/core/components/ui/Select";
import { useOrganizacionesQuery } from "@/modules/organizaciones/hooks/useOrganizacionesQuery";
import { useDestinosTareas } from "../hooks/useDestinosTareas";
import type { ListaTareasSearch } from "../schemas/tareaSchemas";

/** `""` personal · `"asignadas"` · `"o:1"` · `"e:1:5"` · `"p:1:2"` ↔ búsqueda de `/tareas`. */
export const aValor = ({
	asignadas,
	organizacionId,
	equipoId,
	proyectoId,
}: ListaTareasSearch) =>
	asignadas
		? "asignadas"
		: !organizacionId
			? ""
			: equipoId
				? `e:${organizacionId}:${equipoId}`
				: proyectoId
					? `p:${organizacionId}:${proyectoId}`
					: `o:${organizacionId}`;

export const aSearch = (valor: string): ListaTareasSearch => {
	if (valor === "asignadas") return { asignadas: true };
	const [tipo, org, id] = valor.split(":");
	if (!org) return {};
	const organizacionId = Number(org);
	return tipo === "e"
		? { organizacionId, equipoId: Number(id) }
		: tipo === "p"
			? { organizacionId, proyectoId: Number(id) }
			: { organizacionId };
};

function Opciones({
	organizacionId,
	nombre,
}: {
	organizacionId: number;
	nombre: string;
}) {
	const { equipos, proyectos } = useDestinosTareas(organizacionId);
	return (
		<optgroup label={nombre}>
			<option value={`o:${organizacionId}`}>{nombre} · organización</option>
			{equipos.map((e) => (
				<option key={`e${e.id}`} value={`e:${organizacionId}:${e.id}`}>
					Equipo · {e.nombre}
				</option>
			))}
			{proyectos.map((p) => (
				<option key={`p${p.id}`} value={`p:${organizacionId}:${p.id}`}>
					Proyecto · {p.nombre}
				</option>
			))}
		</optgroup>
	);
}

/** Qué tareas ver en `/tareas`: personales, asignadas o las de una organización, equipo o proyecto. */
export function SelectorContextoTareas({
	valor,
	onChange,
}: {
	valor: ListaTareasSearch;
	onChange: (valor: ListaTareasSearch) => void;
}) {
	// shortcut: las 10 organizaciones más recientes, como `MenuNuevo`; paginar si se queda corto.
	const { data: organizaciones } = useOrganizacionesQuery({
		pagina: 1,
		limite: 10,
		orden: "recientes",
	});
	return (
		<Select
			aria-label="Qué tareas ver"
			value={aValor(valor)}
			onChange={(e) => onChange(aSearch(e.target.value))}
		>
			<option value="">Personales</option>
			<option value="asignadas">Asignadas a mí</option>
			{organizaciones?.datos.map((o) => (
				<Opciones key={o.id} organizacionId={o.id} nombre={o.nombre} />
			))}
		</Select>
	);
}
