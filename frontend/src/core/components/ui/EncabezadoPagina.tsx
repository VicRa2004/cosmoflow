import type { ReactNode } from "react";

interface EncabezadoPaginaProps {
	titulo: string;
	descripcion?: ReactNode;
	/** Acciones y filtros de la página, alineados a la derecha. */
	children?: ReactNode;
}

export function EncabezadoPagina({
	titulo,
	descripcion,
	children,
}: EncabezadoPaginaProps) {
	return (
		<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div className="min-w-0">
				<h1 className="text-xl font-semibold tracking-tight text-balance text-tinta">
					{titulo}
				</h1>
				{descripcion && (
					<p className="mt-1 text-sm text-tinta-tenue">{descripcion}</p>
				)}
			</div>
			{children && (
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					{children}
				</div>
			)}
		</div>
	);
}
