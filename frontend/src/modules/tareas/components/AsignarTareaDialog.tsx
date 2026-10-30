import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { Dialog } from "@/core/components/ui/Dialog";
import type { TareaDto } from "../api/tareasApi";
import { useActualizarTareaMutation } from "../hooks/useTareasMutation";
import { CampoResponsables } from "./CampoResponsables";

/** Cambia los responsables sin abrir el editor (RN-44). Montar con `key` por tarea. */
export function AsignarTareaDialog({
	tarea,
	onCerrar,
}: {
	tarea: TareaDto & { organizacionId: number };
	onCerrar: () => void;
}) {
	const [responsableIds, setResponsableIds] = useState(tarea.responsableIds);
	const actualizar = useActualizarTareaMutation();

	return (
		<Dialog
			abierto
			onCerrar={onCerrar}
			titulo="Asignar tarea"
			descripcion={tarea.titulo}
		>
			<form
				className="space-y-4"
				onSubmit={(e) => {
					e.preventDefault();
					actualizar.mutate(
						{ id: tarea.id, datos: { responsableIds } },
						{ onSuccess: onCerrar },
					);
				}}
			>
				<CampoResponsables
					organizacionId={tarea.organizacionId}
					equipoId={tarea.equipoId}
					proyectoId={tarea.proyectoId}
					valor={responsableIds}
					onChange={setResponsableIds}
				/>
				<div className="flex justify-end">
					<Button type="submit" isLoading={actualizar.isPending}>
						Guardar
					</Button>
				</div>
			</form>
		</Dialog>
	);
}
