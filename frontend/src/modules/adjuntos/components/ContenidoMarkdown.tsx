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
	a({ href, ...props }) {
		const externo = href?.startsWith("http") ?? false;
		return (
			<a
				href={href}
				{...props}
				target={externo ? "_blank" : undefined}
				rel={externo ? "noopener noreferrer" : undefined}
			/>
		);
	},
} satisfies MarkdownComponents;

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
			<Markdown components={components}>{children}</Markdown>
		</div>
	);
}
