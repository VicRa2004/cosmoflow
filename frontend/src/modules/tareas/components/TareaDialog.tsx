import { Dialog } from "@/core/components/ui/Dialog";
import type { TareaDto } from "../api/tareasApi";
import { TareaForm } from "./TareaForm";

interface TareaDialogProps {
	/** `null` = cerrado; `"nuevo"` = alta; un DTO = edición. */
	editando: TareaDto | "nuevo" | null;
	onCerrar: () => void;
}

export function TareaDialog({ editando, onCerrar }: TareaDialogProps) {
	return (
		<Dialog
			abierto={editando !== null}
			onCerrar={onCerrar}
			titulo={editando === "nuevo" ? "Nueva tarea" : "Editar tarea"}
		>
			{editando !== null && (
				<TareaForm
					key={editando === "nuevo" ? "nuevo" : editando.id}
					inicial={editando === "nuevo" ? undefined : editando}
					onGuardado={onCerrar}
				/>
			)}
		</Dialog>
	);
}
