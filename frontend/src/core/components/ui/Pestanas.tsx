import type { ReactNode } from "react";

/** Barra de pestañas de una página dividida en secciones (cada pestaña es un `<Link>` con `pestanaProps`). */
export function Pestanas({
	etiqueta,
	children,
}: {
	etiqueta: string;
	children: ReactNode;
}) {
	return (
		<nav
			aria-label={etiqueta}
			className="flex flex-wrap gap-x-1 border-b border-borde"
		>
			{children}
		</nav>
	);
}

/** Props de `<Link>` para una pestaña: subrayado índigo en la activa. */
export const pestanaProps = {
	className:
		"whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
	activeProps: { className: "border-indigo-500 text-tinta" },
	inactiveProps: {
		className: "border-transparent text-tinta-tenue hover:text-tinta",
	},
} as const;
