const WIKILINK = /(?<!!)\[\[([^[\]|#^]+)([#^][^[\]|]*)?(?:\|([^[\]]+))?\]\]/g;

export const hrefWikilink = (destino: string) =>
	`wikilink:${encodeURIComponent(destino).replace(
		/[()]/g,
		(c) => `%${c.charCodeAt(0).toString(16)}`,
	)}`;

/** Un `href` escrito a mano puede traer un `%` suelto: no debe tumbar el editor. */
function decodificar(texto: string) {
	try {
		return decodeURIComponent(texto);
	} catch {
		return texto;
	}
}

const sinSeccion = (destino: string) => destino.replace(/[#^].*$/, "").trim();

/** Título de la nota a la que apunta un `href` `wikilink:…`. */
export const tituloDeWikilink = (href: string) =>
	sinSeccion(decodificar(href.slice("wikilink:".length)));

/** Aplica `transformar` solo al texto que no es código (en bloque o en línea). */
export const fueraDeCodigo = (
	markdown: string,
	transformar: (texto: string) => string,
) =>
	markdown
		.split(/(```[\s\S]*?```|`[^`\n]*`)/)
		.map((trozo, i) => (i % 2 ? trozo : transformar(trozo)))
		.join("");

/**
 * `[[Título]]`, `[[Título|alias]]` y `[[Título#sección]]` → enlace `wikilink:`, que
 * conserva la sección para poder restaurarlo. Los embebidos (`![[...]]`) se quedan
 * como texto. Admite el `\[\[` con el que el editor guardaba los wikilinks escritos.
 */
export const convertirWikilinks = (markdown: string) =>
	markdown
		.replace(/\\\[\\\[/g, "[[")
		.replace(WIKILINK, (_, titulo: string, seccion = "", alias?: string) => {
			const destino = `${titulo}${seccion}`.trim();
			return `[${(alias ?? titulo).trim()}](${hrefWikilink(destino)})`;
		});

/** Inversa de `convertirWikilinks`: lo que se guarda siempre es `[[…]]`, como en Obsidian. */
export const restaurarWikilinks = (markdown: string) =>
	fueraDeCodigo(markdown, (texto) =>
		texto
			.replace(
				/\[((?:\\.|[^\]\\])*)\]\(wikilink:([^)\s]+)\)/g,
				(_, etiqueta: string, href: string) => {
					const destino = decodificar(href);
					// El serializador escapa la puntuación del texto del enlace.
					const alias = etiqueta.replace(/\\([^\p{L}\p{N}\s])/gu, "$1");
					return alias === sinSeccion(destino)
						? `[[${destino}]]`
						: `[[${destino}|${alias}]]`;
				},
			)
			.replace(/\\\[\\\[/g, "[["),
	);
