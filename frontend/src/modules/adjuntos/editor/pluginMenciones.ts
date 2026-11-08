import type { Editor } from "@milkdown/kit/core";
import { linkAttr, linkSchema } from "@milkdown/kit/preset/commonmark";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { $prose } from "@milkdown/kit/utils";
import { tituloDeWikilink } from "./wikilinks";

export interface Mencionable {
	id: number;
	nombre: string;
}

/** `@texto` o `[[texto` a medio escribir: rango a sustituir y dónde abrir el menú. */
export interface ConsultaEditor {
	texto: string;
	desde: number;
	hasta: number;
	x: number;
	y: number;
}

// `@` al inicio o tras un espacio, y lo escrito desde entonces hasta el cursor.
export const CONSULTA_MENCION = /(?<=^|\s)@([\p{L}\p{N}_.-]{0,30})$/u;

/** Avisa en cada cambio del editor si antes del cursor hay algo que encaje con `patron`. */
export const pluginConsulta = (
	patron: RegExp,
	onConsulta: (consulta: ConsultaEditor | null, view: EditorView) => void,
) =>
	$prose(
		() =>
			new Plugin({
				key: new PluginKey("consulta"),
				view: () => ({
					update: (view) => onConsulta(consultaEn(view, patron), view),
				}),
			}),
	);

/**
 * Milkdown vacía el `href` de los protocolos desconocidos al pintar (el markdown sí
 * guarda `mencion:<id>` y `wikilink:…`): los `data-*` permiten darles estilo, abrirlos
 * y, con `data-href`, recuperar el destino al copiar y pegar.
 */
export const marcarEnlaces = (editor: Editor) =>
	editor.config((ctx) =>
		ctx.set(linkAttr.key, (mark) => {
			const href = String(mark.attrs.href);
			if (href.startsWith("mencion:"))
				return { "data-mencion": "", "data-href": href };
			if (href.startsWith("wikilink:"))
				return { "data-wikilink": tituloDeWikilink(href), "data-href": href };
			return {};
		}),
	);

/** Al pegar, el enlace se lee de `data-href`: su `href` llega vacío. */
export const enlacesPegables = linkSchema.extendSchema((previo) => (ctx) => {
	const esquema = previo(ctx);
	return {
		...esquema,
		parseDOM: [
			{
				tag: "a[data-href]",
				getAttrs: (dom) => ({
					href: (dom as HTMLElement).dataset.href,
					title: null,
				}),
			},
			...(esquema.parseDOM ?? []),
		],
	};
});

function consultaEn(view: EditorView, patron: RegExp): ConsultaEditor | null {
	const { selection } = view.state;
	if (!selection.empty || !view.hasFocus()) return null;
	const { $from } = selection;
	// Ni en bloques de código ni dentro de un enlace (o de una mención ya hecha).
	if ($from.parent.type.spec.code) return null;
	if ($from.marks().some((m) => m.type.name === "link")) return null;
	const antes = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
	const encontrada = antes.match(patron);
	if (!encontrada) return null;
	const desde = $from.pos - encontrada[0].length;
	const { left, bottom } = view.coordsAtPos(desde);
	return { texto: encontrada[1], desde, hasta: $from.pos, x: left, y: bottom };
}

/** Sustituye `@texto` por `[@Nombre](mencion:<id>)` y un espacio fuera del enlace. */
export function insertarMencion(
	view: EditorView,
	{ desde, hasta }: ConsultaEditor,
	{ id, nombre }: Mencionable,
): void {
	const { schema, tr } = view.state;
	const enlace = schema.marks.link.create({ href: `mencion:${id}` });
	view.dispatch(
		tr
			.replaceWith(desde, hasta, [
				schema.text(`@${nombre}`, [enlace]),
				schema.text(" "),
			])
			.scrollIntoView(),
	);
	view.focus();
}

const normalizar = (texto: string) =>
	texto
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();

/** Los que contienen lo escrito, sin distinguir mayúsculas ni tildes. */
export const filtrarMencionables = (
	mencionables: Mencionable[],
	texto: string,
): Mencionable[] =>
	mencionables
		.filter((m) => normalizar(m.nombre).includes(normalizar(texto)))
		.slice(0, 6);
