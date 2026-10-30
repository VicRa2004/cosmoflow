import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import { cn } from "@/core/utils/cn";
import { ImagenAdjunto } from "./ImagenAdjunto";

// Sin `allowHtml`: el HTML del usuario se muestra como texto y no hay que sanearlo.
const components = {
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
} satisfies MarkdownComponents;

/** Por defecto se quitan los protocolos desconocidos; `mencion:<id>` se deja pasar. */
const urlTransform = (
	url: string,
	kind: "link" | "image",
	porDefecto: string,
) => (kind === "link" && /^mencion:\d+$/.test(url) ? url : porDefecto);

/**
 * Crepe guarda las líneas vacías y los saltos con Shift+Enter como `<br />`, que sin
 * `allowHtml` saldrían como texto: la línea vacía pasa a un párrafo con un espacio de
 * ancho cero (el parser recorta el espacio duro) y el salto en línea a un salto de
 * markdown (`\`). No toca el código.
 */
function convertirSaltos(markdown: string) {
	return markdown
		.split(/(```[\s\S]*?```|`[^`\n]*`)/)
		.map((trozo, i) =>
			i % 2
				? trozo
				: trozo
						.replace(/^[ \t]*<br\s*\/?>[ \t]*$/gim, "\u200b")
						.replace(/<br\s*\/?>\n?/gi, "\\\n"),
		)
		.join("");
}

/** Markdown de tareas y notas, con las imágenes privadas de `/api/adjuntos`. */
export function ContenidoMarkdown({
	children,
	className,
}: {
	children: string;
	className?: string;
}) {
	return (
		<div className={cn("markdown", className)}>
			<Markdown components={components} urlTransform={urlTransform}>
				{convertirSaltos(children)}
			</Markdown>
		</div>
	);
}
