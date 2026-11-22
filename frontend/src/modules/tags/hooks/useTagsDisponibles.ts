import { textoListaRecortada } from "@/core/components/ui/AvisoListaRecortada";
import { useTagsQuery } from "./useTagsQuery";

// shortcut: solo los 100 primeros tags (por nombre); `aviso` lo dice si hay más. Paginar el selector si alguien llega al tope.
const LIMITE = 100;

/**
 * Tags del usuario (o, con `organizacionId`, de esa organización) para elegir y para
 * mostrar el nombre de los `tagIds`. `aviso` no es `null` si quedaron tags fuera.
 */
export function useTagsDisponibles(organizacionId?: number | null) {
	const { data } = useTagsQuery(
		{ pagina: 1, limite: LIMITE },
		organizacionId ?? undefined,
	);
	const tags = data?.datos ?? [];
	const aviso = textoListaRecortada({
		limite: LIMITE,
		total: data?.totalElementos,
		nombre: "tags",
	});
	return { tags, aviso };
}
