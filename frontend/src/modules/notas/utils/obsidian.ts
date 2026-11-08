import type { ImportarNotasInput } from "../api/notasApi";

type NotaImportada = ImportarNotasInput["notas"][number];

/** Lo que admite el backend por nota. */
const MAX_CONTENIDO = 100_000;

/**
 * `.md` de un vault de Obsidian (o sueltos) → notas con su ruta de carpetas. Se
 * saltan las carpetas ocultas (`.obsidian`, `.trash`) y lo que no es markdown;
 * el contenido va tal cual (wikilinks y frontmatter incluidos).
 */
export async function leerArchivosObsidian(archivos: File[]): Promise<{
	notas: NotaImportada[];
	omitidas: string[];
}> {
	const notas: NotaImportada[] = [];
	const omitidas: string[] = [];
	for (const archivo of archivos) {
		const ruta = (archivo.webkitRelativePath || archivo.name).split("/");
		const nombre = ruta.pop() ?? "";
		if (
			!nombre.toLowerCase().endsWith(".md") ||
			ruta.some((p) => p.startsWith("."))
		)
			continue;
		const contenido = await archivo.text();
		if (contenido.length > MAX_CONTENIDO) {
			omitidas.push(nombre);
			continue;
		}
		notas.push({
			carpeta: ruta.map((p) => p.slice(0, 120)),
			titulo: nombre.slice(0, -3).slice(0, 255) || "Sin título",
			contenido,
		});
	}
	return { notas, omitidas };
}

/** Lotes del tamaño que acepta `POST /api/notas/importar`. */
export function enLotes<T>(lista: T[], tamano = 200): T[][] {
	const lotes: T[][] = [];
	for (let i = 0; i < lista.length; i += tamano)
		lotes.push(lista.slice(i, i + tamano));
	return lotes;
}
