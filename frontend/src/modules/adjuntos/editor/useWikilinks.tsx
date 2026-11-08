import { InputRule } from "@milkdown/kit/prose/inputrules";
import type { EditorView } from "@milkdown/kit/prose/view";
import { $inputRule } from "@milkdown/kit/utils";
import { useRouter } from "@tanstack/react-router";
import { type RefObject, useEffect, useState } from "react";
import { useNotasQuery } from "@/modules/notas/hooks/useNotasQuery";
import type { AmbitoWikilinks } from "../components/ContenidoMarkdown";
import {
	type ConsultaEditor,
	filtrarMencionables,
	type Mencionable,
} from "./pluginMenciones";
import { useMenuEditor } from "./useMenuEditor";
import { hrefWikilink } from "./wikilinks";

const CONSULTA = /(?<!!)\[\[([^[\]|#^\n]{0,80})$/;
// Estos caracteres tienen significado dentro de `[[…]]`: un título con ellos no se puede enlazar.
const NO_ENLAZABLE = /[[\]|#^]/;

/** Al cerrar `[[Título]]` o `[[Título|alias]]` a mano se convierte en enlace. */
export const reglaWikilink = $inputRule(
	() =>
		new InputRule(
			/(?<!!)\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]$/,
			(state, [, destino, alias], desde, hasta) => {
				const { schema, tr } = state;
				const enlace = schema.marks.link.create({
					href: hrefWikilink(destino.trim()),
				});
				const texto = (alias ?? destino.replace(/[#^].*$/, "")).trim();
				return texto
					? tr
							.replaceWith(desde, hasta, schema.text(texto, [enlace]))
							.removeStoredMark(enlace)
					: null;
			},
		),
);

function insertarWikilink(
	view: EditorView,
	{ desde, hasta }: ConsultaEditor,
	{ nombre }: Mencionable,
): void {
	const { schema, tr } = view.state;
	const enlace = schema.marks.link.create({ href: hrefWikilink(nombre) });
	view.dispatch(
		tr
			.replaceWith(desde, hasta, [
				schema.text(nombre, [enlace]),
				schema.text(" "),
			])
			.scrollIntoView(),
	);
	view.focus();
}

/**
 * Wikilinks al editar: `[[` abre el buscador de notas y Ctrl/Cmd+clic abre la nota en
 * otra pestaña (en esta se perdería lo que no esté guardado).
 */
export function useWikilinks(
	raiz: RefObject<HTMLElement | null>,
	{ organizacionId, proyectoId }: AmbitoWikilinks = {},
) {
	const router = useRouter();
	const [texto, setTexto] = useState<string | null>(null);
	const { data } = useNotasQuery(
		{ busqueda: texto?.trim() || undefined, proyectoId, limite: 50 },
		texto !== null,
	);
	const notas = (data?.datos ?? [])
		.filter((nota) => !NO_ENLAZABLE.test(nota.titulo))
		.map((nota) => ({ id: nota.id, nombre: nota.titulo }));

	useEffect(() => {
		const elemento = raiz.current;
		if (!elemento) return;
		const enlaceDe = (evento: Event) =>
			(evento.target as HTMLElement).closest<HTMLElement>("a[data-wikilink]");
		const onClick = (evento: MouseEvent) => {
			const enlace = enlaceDe(evento);
			if (!enlace) return;
			evento.preventDefault();
			if (!evento.ctrlKey && !evento.metaKey) return;
			const { href } = router.buildLocation({
				to: "/notas/enlace",
				search: {
					titulo: enlace.dataset.wikilink ?? "",
					organizacionId,
					proyectoId,
				},
			});
			window.open(href, "_blank");
		};
		// El tooltip de enlaces de Crepe mostraría el `wikilink:…` crudo.
		const onMover = (evento: MouseEvent) => {
			if (enlaceDe(evento)) evento.stopPropagation();
		};
		elemento.addEventListener("click", onClick);
		elemento.addEventListener("mousemove", onMover, true);
		return () => {
			elemento.removeEventListener("click", onClick);
			elemento.removeEventListener("mousemove", onMover, true);
		};
	}, [raiz, router, organizacionId, proyectoId]);

	return useMenuEditor(raiz, {
		activo: true,
		patron: CONSULTA,
		etiqueta: "Enlazar nota",
		insertar: insertarWikilink,
		opciones: (consulta) => filtrarMencionables(notas, consulta),
		onTexto: setTexto,
	});
}
