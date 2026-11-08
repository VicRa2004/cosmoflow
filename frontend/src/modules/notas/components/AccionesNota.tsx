import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import type { NotaDto } from "../api/notasApi";
import { useEliminarNotaMutation } from "../hooks/useNotasMutation";
import { descargarNotaMd } from "../utils/exportar";

/** Descargar en `.md` y eliminar: cabecera de la nota, en edición y en lectura. */
export function AccionesNota({
	nota,
	onEliminada,
}: {
	nota: NotaDto;
	onEliminada: () => void;
}) {
	const { puede } = usePermisos();
	const eliminar = useEliminarNotaMutation();
	const [confirmando, setConfirmando] = useState(false);
	return (
		<>
			<Button
				variant="ghost"
				size="sm"
				aria-label="Descargar .md"
				title="Descargar .md"
				onClick={() => descargarNotaMd(nota)}
			>
				<Download className="h-4 w-4" />
			</Button>
			{puede("notas:eliminar") && (
				<Button
					variant="dangerGhost"
					size="sm"
					aria-label="Eliminar"
					title="Eliminar"
					onClick={() => setConfirmando(true)}
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			)}
			<ConfirmDialog
				abierto={confirmando}
				titulo="¿Eliminar nota?"
				mensaje="Esta acción no se puede deshacer."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setConfirmando(false)}
				onConfirmar={() => eliminar.mutate(nota.id, { onSuccess: onEliminada })}
			/>
		</>
	);
}
