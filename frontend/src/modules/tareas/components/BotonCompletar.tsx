import { CircleCheck, RotateCcw } from "lucide-react";
import { usePermisos } from "@/core/auth/usePermisos";
import { Button } from "@/core/components/ui/Button";
import type { TareaDto } from "../api/tareasApi";
import { useActualizarTareaMutation } from "../hooks/useTareasMutation";

/** Dice lo que hará: «Completar» si está abierta, «Reabrir» si está completada; nada si cancelada. */
export function BotonCompletar({ tarea }: { tarea: TareaDto }) {
	const { puede } = usePermisos();
	const actualizar = useActualizarTareaMutation();
	if (!puede("tareas:actualizar") || tarea.estado === "cancelada") return null;

	const completada = tarea.estado === "completada";
	const Icono = completada ? RotateCcw : CircleCheck;
	return (
		<Button
			variant="outline"
			size="sm"
			isLoading={actualizar.isPending}
			aria-label={`${completada ? "Reabrir" : "Completar"} «${tarea.titulo}»`}
			onClick={() =>
				actualizar.mutate({
					id: tarea.id,
					datos: { estado: completada ? "pendiente" : "completada" },
				})
			}
		>
			{!actualizar.isPending && <Icono className="h-4 w-4" />}
			{completada ? "Reabrir" : "Completar"}
		</Button>
	);
}
