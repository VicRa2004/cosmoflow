/**
 * Editor de la app móvil: el mismo Crepe de la web, empaquetado con
 * `pnpm build:editor-movil` en `mobile/assets/editor/` y abierto en un WebView.
 * Habla con Flutter por el canal `Cosmoflow` (mensajes JSON) y recibe
 * `window.iniciarEditor(...)`. Sin imágenes, menciones ni menú de `[[`: necesitan la API.
 */
import { CrepeBuilder } from "@milkdown/crepe/builder";
import { blockEdit } from "@milkdown/crepe/feature/block-edit";
import { cursor } from "@milkdown/crepe/feature/cursor";
import { linkTooltip } from "@milkdown/crepe/feature/link-tooltip";
import { listItem } from "@milkdown/crepe/feature/list-item";
import { placeholder as rotulo } from "@milkdown/crepe/feature/placeholder";
import { table } from "@milkdown/crepe/feature/table";
import { toolbar } from "@milkdown/crepe/feature/toolbar";
// Features y estilos uno a uno: `Crepe` y `style.css` traen KaTeX, CodeMirror y sus
// lenguajes (varios MB). Los bloques de código quedan sin resaltado.
import "@milkdown/crepe/theme/common/prosemirror.css";
import "@milkdown/crepe/theme/common/reset.css";
import "@milkdown/crepe/theme/common/block-edit.css";
import "@milkdown/crepe/theme/common/cursor.css";
import "@milkdown/crepe/theme/common/link-tooltip.css";
import "@milkdown/crepe/theme/common/list-item.css";
import "@milkdown/crepe/theme/common/placeholder.css";
import "@milkdown/crepe/theme/common/toolbar.css";
import "@milkdown/crepe/theme/common/table.css";
import "./movil.css";
import { etiquetasBloques, etiquetasToolbar } from "./configCrepe";
import { enlacesPegables, marcarEnlaces } from "./pluginMenciones";
import {
	convertirWikilinks,
	fueraDeCodigo,
	restaurarWikilinks,
} from "./wikilinks";

interface Opciones {
	markdown: string;
	placeholder: string;
	/** Tokens del tema de la app, como `--fondo: #rrggbb`. */
	colores: Record<string, string>;
}

declare global {
	interface Window {
		iniciarEditor: (opciones: Opciones) => void;
		Cosmoflow?: { postMessage: (mensaje: string) => void };
	}
}

const enviar = (mensaje: Record<string, unknown>) =>
	window.Cosmoflow?.postMessage(JSON.stringify(mensaje));

let ultimo: string | undefined;
const enviarMarkdown = (md: string) => {
	const markdown = restaurarWikilinks(md);
	if (markdown !== ultimo) enviar({ markdown });
	ultimo = markdown;
};

/** Borde inferior del cursor, para que Flutter lo deje por encima del teclado. */
function avisarCursor() {
	const seleccion = getSelection();
	if (!seleccion?.rangeCount) return;
	const rango = seleccion.getRangeAt(0);
	const nodo = rango.startContainer;
	const caja =
		rango.getClientRects()[0] ??
		(nodo instanceof Element
			? nodo
			: nodo.parentElement
		)?.getBoundingClientRect();
	if (caja) enviar({ cursor: caja.bottom + scrollY });
}

window.iniciarEditor = ({ markdown, placeholder, colores }) => {
	for (const [nombre, valor] of Object.entries(colores))
		document.documentElement.style.setProperty(nombre, valor);
	const raiz = document.getElementById("editor") as HTMLElement;
	// Crepe normaliza el documento al abrirlo: eso no cuenta como un cambio del usuario.
	let tocado = false;
	for (const evento of ["beforeinput", "keydown", "paste", "drop"])
		raiz.addEventListener(evento, () => (tocado = true), {
			capture: true,
			once: true,
		});
	const crepe = new CrepeBuilder({
		root: raiz,
		defaultValue: fueraDeCodigo(markdown, convertirWikilinks),
	})
		.addFeature(cursor)
		.addFeature(listItem)
		.addFeature(linkTooltip)
		.addFeature(table)
		.addFeature(rotulo, { text: placeholder })
		.addFeature(blockEdit, etiquetasBloques)
		.addFeature(toolbar, etiquetasToolbar);
	crepe.editor.use(enlacesPegables);
	marcarEnlaces(crepe.editor);
	crepe.on((api) =>
		api.markdownUpdated((_ctx, md) => {
			if (tocado) enviarMarkdown(md);
		}),
	);
	crepe.create().then(() => {
		// Milkdown avisa con 200 ms de retraso: al escribir se manda ya, por si se pulsa
		// «Guardar». En el siguiente tick, cuando ProseMirror ya leyó el cambio del DOM.
		raiz.addEventListener("input", () => {
			tocado = true;
			setTimeout(() => enviarMarkdown(crepe.getMarkdown()));
		});
		raiz.addEventListener("focusout", () => enviar({ cursor: null }));
		document.addEventListener("selectionchange", avisarCursor);
		// Alto del contenido (no del WebView, que nunca bajaría): Flutter ajusta el suyo.
		new ResizeObserver(() =>
			enviar({
				altura: Math.ceil(document.body.getBoundingClientRect().height),
			}),
		).observe(document.body);
	});
};
