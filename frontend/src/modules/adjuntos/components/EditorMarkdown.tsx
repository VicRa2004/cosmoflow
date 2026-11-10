import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useFieldContext } from "@/core/components/form/contextos";
import { cn } from "@/core/utils/cn";
import { type AmbitoAdjunto, adjuntosApi } from "../api/adjuntosApi";
import {
	etiquetasBloques,
	etiquetasToolbar,
	PLACEHOLDER_EDITOR,
} from "../editor/configCrepe";
import {
	CONSULTA_MENCION,
	enlacesPegables,
	filtrarMencionables,
	insertarMencion,
	type Mencionable,
	marcarEnlaces,
} from "../editor/pluginMenciones";
import { useMenuEditor } from "../editor/useMenuEditor";
import { reglaWikilink, useWikilinks } from "../editor/useWikilinks";
import {
	convertirWikilinks,
	fueraDeCodigo,
	restaurarWikilinks,
} from "../editor/wikilinks";
import type { AmbitoWikilinks } from "./ContenidoMarkdown";
import { useSubirAdjuntoMutation } from "../hooks/useSubirAdjuntoMutation";

interface EditorMarkdownProps {
	label: string;
	placeholder?: string;
	className?: string;
	/** En una tarea o nota compartida: las imágenes se comparten con sus miembros. */
	ambito?: AmbitoAdjunto;
	/** Con ella, `@` abre el menú para mencionar a una de estas personas. */
	mencionables?: Mencionable[];
	/** Dónde buscar las notas de los `[[wikilinks]]`; sin él, en las personales. */
	wikilinks?: AmbitoWikilinks;
}

/**
 * Campo markdown tipo Notion (Milkdown Crepe): `/` abre el menú de bloques, al
 * seleccionar texto sale la barra de formato e insertar o pegar una imagen la sube
 * a `/api/adjuntos`, `[[` enlaza una nota y, con `mencionables`, `@` menciona a
 * alguien. Guarda markdown.
 * Va dentro de `form.AppField`.
 */
export function EditorMarkdown({
	label,
	placeholder,
	className,
	ambito,
	mencionables,
	wikilinks,
}: EditorMarkdownProps) {
	const campo = useFieldContext<string>();
	const raiz = useRef<HTMLFieldSetElement>(null);
	const subir = useSubirAdjuntoMutation(ambito);
	// Crepe guarda los callbacks al crearse: los refs le dan siempre los actuales.
	const subirRef = useRef(subir.mutateAsync);
	subirRef.current = subir.mutateAsync;
	const cambiarRef = useRef(campo.handleChange);
	cambiarRef.current = campo.handleChange;
	const menciones = useMenuEditor(raiz, {
		activo: !!mencionables,
		patron: CONSULTA_MENCION,
		etiqueta: "Mencionar a",
		opciones: (texto) => filtrarMencionables(mencionables ?? [], texto),
		insertar: insertarMencion,
	});
	const enlacesNotas = useWikilinks(raiz, wikilinks);
	const volcarRef = useRef<(() => void) | null>(null);
	// Layout: corre antes que los efectos de limpieza del formulario, que guardan al salir.
	useLayoutEffect(() => () => volcarRef.current?.(), []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: el valor inicial se lee una vez; después manda el editor
	useEffect(() => {
		// Crepe normaliza el documento al abrirlo: eso no cuenta como un cambio del usuario.
		let tocado = false;
		for (const evento of ["keydown", "pointerdown", "paste", "drop"])
			raiz.current?.addEventListener(evento, () => (tocado = true), {
				capture: true,
				once: true,
			});
		const crepe = new Crepe({
			root: raiz.current,
			defaultValue: fueraDeCodigo(campo.state.value, convertirWikilinks),
			features: { [Crepe.Feature.Latex]: false },
			featureConfigs: {
				[Crepe.Feature.Placeholder]: {
					text: placeholder ?? PLACEHOLDER_EDITOR,
				},
				[Crepe.Feature.BlockEdit]: etiquetasBloques,
				[Crepe.Feature.Toolbar]: etiquetasToolbar,
				[Crepe.Feature.ImageBlock]: {
					onUpload: async (archivo) => (await subirRef.current(archivo)).url,
					// shortcut: el blob URL no se libera hasta recargar; basta para una sesión de edición.
					proxyDomURL: async (url) =>
						url.startsWith("/api/adjuntos/")
							? URL.createObjectURL(await adjuntosApi.descargar(url))
							: url,
					blockUploadButton: "Subir imagen",
					blockConfirmButton: "Confirmar",
					blockCaptionPlaceholderText: "Pie de imagen",
					blockUploadPlaceholderText: "o pega un enlace",
					inlineUploadPlaceholderText: "o pega un enlace",
				},
			},
		});
		if (menciones.plugin) crepe.editor.use(menciones.plugin);
		if (enlacesNotas.plugin) crepe.editor.use(enlacesNotas.plugin);
		crepe.editor.use(reglaWikilink).use(enlacesPegables);
		marcarEnlaces(crepe.editor);
		crepe.on((api) =>
			api.markdownUpdated((_ctx, markdown) => {
				if (tocado) cambiarRef.current(restaurarWikilinks(markdown));
			}),
		);
		const creado = crepe.create();
		// Milkdown avisa con 200 ms de retraso: al salir se recoge lo último escrito.
		creado.then(() => {
			volcarRef.current = () => {
				if (tocado) cambiarRef.current(restaurarWikilinks(crepe.getMarkdown()));
			};
		});
		return () => {
			volcarRef.current = null;
			creado.then(() => crepe.destroy());
		};
	}, []);

	// El menú va fuera del fieldset: dentro, el DOM es de Crepe.
	return (
		<>
			<fieldset
				ref={raiz}
				aria-label={label}
				className={cn("editor-markdown min-w-0", className)}
			/>
			{menciones.menu}
			{enlacesNotas.menu}
		</>
	);
}
