import type { Editor } from "@milkdown/kit/core";
import { linkAttr } from "@milkdown/kit/preset/commonmark";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { $prose } from "@milkdown/kit/utils";

export interface Mencionable {
	id: number;
	nombre: string;
}

/** `@texto` que se está escribiendo: rango a sustituir y dónde abrir el menú. */
export interface ConsultaMencion {
	texto: string;
	desde: number;
	hasta: number;
	x: number;
	y: number;
}

// `@` al inicio o tras un espacio, y lo escrito desde entonces hasta el cursor.
const ANTES_DEL_CURSOR = /(?:^|\s)@([\p{L}\p{N}_.-]{0,30})$/u;

/** Avisa en cada cambio del editor si hay una mención a medio escribir. */
export const pluginMenciones = (
	onConsulta: (consulta: ConsultaMencion | null, view: EditorView) => void,
) =>
	$prose(
		() =>
			new Plugin({
				key: new PluginKey("menciones"),
				view: () => ({
					update: (view) => onConsulta(consultaEn(view), view),
				}),
			}),
	);

/**
 * Milkdown vacía el `href` de los protocolos desconocidos al pintar (el markdown sí
 * guarda `mencion:<id>`): `data-mencion` permite darle estilo de chip en el editor.
 */
export const marcarMenciones = (editor: Editor) =>
	editor.config((ctx) =>
		ctx.set(linkAttr.key, (mark) =>
			String(mark.attrs.href).startsWith("mencion:")
				? { "data-mencion": "" }
				: {},
		),
	);

function consultaEn(view: EditorView): ConsultaMencion | null {
	const { selection } = view.state;
	if (!selection.empty || !view.hasFocus()) return null;
	const { $from } = selection;
	// Ni en bloques de código ni dentro de un enlace (o de una mención ya hecha).
	if ($from.parent.type.spec.code) return null;
	if ($from.marks().some((m) => m.type.name === "link")) return null;
	const antes = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
	const encontrada = antes.match(ANTES_DEL_CURSOR);
	if (!encontrada) return null;
	const desde = $from.pos - encontrada[1].length - 1;
	const { left, bottom } = view.coordsAtPos(desde);
	return { texto: encontrada[1], desde, hasta: $from.pos, x: left, y: bottom };
}

/** Sustituye `@texto` por `[@Nombre](mencion:<id>)` y un espacio fuera del enlace. */
export function insertarMencion(
	view: EditorView,
	{ desde, hasta }: ConsultaMencion,
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
