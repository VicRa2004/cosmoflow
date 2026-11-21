import { useNavigate } from "@tanstack/react-router";
import { Copy, Download, Pin, Trash2 } from "lucide-react";
import { useState } from "react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import type { NotaDto } from "../api/notasApi";
import {
	useDuplicarNotaMutation,
	useEliminarNotaMutation,
	useFijarNotaMutation,
} from "../hooks/useNotasMutation";
import { descargarNotaMd } from "../utils/exportar";

/** Fijar, duplicar, descargar en `.md` y eliminar: cabecera de la nota, en edición y en lectura. */
export function AccionesNota({
	nota,
	onEliminada,
}: {
	nota: NotaDto;
	onEliminada: () => void;
}) {
	const navigate = useNavigate();
	const { puede } = usePermisos();
	const eliminar = useEliminarNotaMutation();
	const duplicar = useDuplicarNotaMutation();
	const fijar = useFijarNotaMutation();
	const [confirmando, setConfirmando] = useState(false);
	return (
		<>
			{puede("notas:actualizar") && (
				<Button
					variant="ghost"
					size="sm"
					aria-label={nota.isFijada ? "Desfijar nota" : "Fijar nota"}
					title={nota.isFijada ? "Desfijar" : "Fijar"}
					isLoading={fijar.isPending}
					onClick={() =>
						fijar.mutate({ id: nota.id, isFijada: !nota.isFijada })
					}
				>
					<Pin
						className={nota.isFijada ? "h-4 w-4 text-indigo-400" : "h-4 w-4"}
					/>
				</Button>
			)}
			{puede("notas:crear") && (
				<Button
					variant="ghost"
					size="sm"
					aria-label="Duplicar nota"
					title="Duplicar"
					isLoading={duplicar.isPending}
					onClick={() =>
						duplicar.mutate(nota.id, {
							onSuccess: (copia) =>
								navigate({
									to: "/notas/$id",
									params: { id: String(copia.id) },
								}),
						})
					}
				>
					<Copy className="h-4 w-4" />
				</Button>
			)}
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
				mensaje="Irá a la papelera, donde podrás restaurarla durante 30 días."
				textoConfirmar="Eliminar"
				peligroso
				isLoading={eliminar.isPending}
				onCancelar={() => setConfirmando(false)}
				onConfirmar={() => eliminar.mutate(nota.id, { onSuccess: onEliminada })}
			/>
		</>
	);
}
