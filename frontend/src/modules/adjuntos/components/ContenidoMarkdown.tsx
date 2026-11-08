import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { cn } from "@/core/utils/cn";
import {
	convertirWikilinks,
	fueraDeCodigo,
	tituloDeWikilink,
} from "../editor/wikilinks";
import { ImagenAdjunto } from "./ImagenAdjunto";

/** Dónde se buscan las notas de los wikilinks: sin proyecto, las personales. */
export interface AmbitoWikilinks {
	organizacionId?: number;
	proyectoId?: number;
}

// Sin `allowHtml`: el HTML del usuario se muestra como texto y no hay que sanearlo.
const crearComponents = (ambito: AmbitoWikilinks) =>
	({
		img({ src, alt = "", ...props }) {
			return typeof src === "string" && src.startsWith("/api/adjuntos/") ? (
				<ImagenAdjunto src={src} alt={alt} {...props} />
			) : (
				<img src={src} alt={alt} {...props} />
			);
		},
		a({ href, children, ...props }) {
			// Mención de una tarea (`[@Ana](mencion:12)`): un chip, no un enlace.
			if (href?.startsWith("mencion:")) {
				return <span className="mencion">{children}</span>;
			}
			// Wikilink de Obsidian (`[[Título]]`): abre la nota con ese título.
			if (href?.startsWith("wikilink:")) {
				return (
					<Link
						to="/notas/enlace"
						search={{
							titulo: tituloDeWikilink(href),
							...ambito,
						}}
						className="wikilink"
					>
						{children}
					</Link>
				);
			}
			const externo = href?.startsWith("http") ?? false;
			return (
				<a
					href={href}
					{...props}
					target={externo ? "_blank" : undefined}
					rel={externo ? "noopener noreferrer" : undefined}
				>
					{children}
				</a>
			);
		},
	}) satisfies MarkdownComponents;

/** Por defecto se quitan los protocolos desconocidos; `mencion:<id>` y `wikilink:` se dejan pasar. */
const urlTransform = (
	url: string,
	kind: "link" | "image",
	porDefecto: string,
) =>
	kind === "link" && /^(mencion:\d+$|wikilink:)/.test(url) ? url : porDefecto;

/**
 * Crepe guarda las líneas vacías y los saltos con Shift+Enter como `<br />`, que sin
 * `allowHtml` saldrían como texto: la línea vacía pasa a un párrafo con un espacio de
 * ancho cero (el parser recorta el espacio duro) y el salto en línea a un salto de
 * markdown (`\`). No toca el código.
 */
function convertirSaltos(markdown: string) {
	return fueraDeCodigo(markdown, (trozo) =>
		convertirWikilinks(trozo)
			.replace(/^[ \t]*<br\s*\/?>[ \t]*$/gim, "\u200b")
			.replace(/<br\s*\/?>\n?/gi, "\\\n"),
	);
}

/** Markdown de tareas y notas, con las imágenes privadas de `/api/adjuntos` y wikilinks. */
export function ContenidoMarkdown({
	children,
	className,
	ambito,
}: {
	children: string;
	className?: string;
	ambito?: AmbitoWikilinks;
}) {
	const { organizacionId, proyectoId } = ambito ?? {};
	const components = useMemo(
		() => crearComponents({ organizacionId, proyectoId }),
		[organizacionId, proyectoId],
	);
	return (
		<div className={cn("markdown", className)}>
			<Markdown components={components} urlTransform={urlTransform}>
				{convertirSaltos(children)}
			</Markdown>
		</div>
	);
}
