import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/core/components/ui/Button";
import { ContenidoMarkdown } from "./ContenidoMarkdown";

interface PaginaLecturaProps {
	onVolver: () => void;
	/** Botones de la cabecera (editar, mover, eliminar…). */
	acciones?: ReactNode;
	titulo: string;
	/** Propiedades bajo el título (estado, vencimiento, tags…). */
	detalles?: ReactNode;
	contenido: string;
}

/** Lectura de una tarea o nota a página completa: el markdown renderizado y sus acciones. */
export function PaginaLectura({
	onVolver,
	acciones,
	titulo,
	detalles,
	contenido,
}: PaginaLecturaProps) {
	return (
		<article className="mx-auto max-w-3xl space-y-6">
			<div className="flex items-center justify-between gap-2">
				<Button variant="ghost" size="sm" onClick={onVolver}>
					<ArrowLeft className="h-4 w-4" />
					Volver
				</Button>
				<div className="flex flex-wrap items-center justify-end gap-2">
					{acciones}
				</div>
			</div>
			<h1 className="text-3xl font-bold tracking-tight text-tinta">
				{titulo || "Sin título"}
			</h1>
			{detalles}
			<div className="border-t border-borde pt-6">
				{contenido.trim() ? (
					<ContenidoMarkdown>{contenido}</ContenidoMarkdown>
				) : (
					<p className="text-sm text-tinta-tenue">Sin contenido.</p>
				)}
			</div>
		</article>
	);
}
