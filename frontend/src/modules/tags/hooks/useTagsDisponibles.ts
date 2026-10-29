import { useTagsQuery } from "./useTagsQuery";

// shortcut: solo los 100 primeros tags (por nombre); paginar el selector si alguien tiene más.
const LIMITE = 100;

/** Tags del usuario para elegir y para mostrar el nombre de los `tagIds`. */
export function useTagsDisponibles() {
	const { data } = useTagsQuery({ pagina: 1, limite: LIMITE });
	const tags = data?.datos ?? [];
	return { tags, nombre: new Map(tags.map((t) => [t.id, t.nombre])) };
}
