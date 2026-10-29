import { Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/core/components/ui/Button";
import { Dialog } from "@/core/components/ui/Dialog";
import { ContenidoMarkdown } from "./ContenidoMarkdown";

interface DialogoLecturaProps {
	abierto: boolean;
	onCerrar: () => void;
	titulo: string;
	/** Propiedades bajo el título (estado, vencimiento, tags…). */
	detalles?: ReactNode;
	contenido: string;
	/** Sin él no se muestra «Editar» (p. ej. sin permiso de actualizar). */
	onEditar?: () => void;
}

/** Lectura de una tarea o nota: el markdown renderizado y el paso a edición. */
export function DialogoLectura({
	abierto,
	onCerrar,
	titulo,
	detalles,
	contenido,
	onEditar,
}: DialogoLecturaProps) {
	return (
		<Dialog
			abierto={abierto}
			onCerrar={onCerrar}
			titulo={titulo}
			className="max-w-2xl"
		>
			{detalles}
			<div className="max-h-[60vh] overflow-y-auto border-t border-borde pt-4">
				{contenido.trim() ? (
					<ContenidoMarkdown>{contenido}</ContenidoMarkdown>
				) : (
					<p className="text-sm text-tinta-tenue">Sin contenido.</p>
				)}
			</div>
			{onEditar && (
				<div className="flex justify-end border-t border-borde pt-4">
					<Button variant="outline" onClick={onEditar}>
						<Pencil className="h-4 w-4" />
						Editar
					</Button>
				</div>
			)}
		</Dialog>
	);
}
