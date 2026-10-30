import { CasillasIds } from "@/modules/equipos/components/CasillasIds";
import { useMiembrosDestino } from "../hooks/useMiembrosDestino";

interface CampoResponsablesProps {
	organizacionId: number;
	equipoId?: number | null;
	proyectoId?: number | null;
	valor: number[];
	onChange: (valor: number[]) => void;
}

/** Responsables entre quienes ven la tarea (RN-23, 44). Solo para tareas compartidas. */
export function CampoResponsables({
	organizacionId,
	equipoId,
	proyectoId,
	valor,
	onChange,
}: CampoResponsablesProps) {
	const miembros = useMiembrosDestino(organizacionId, equipoId, proyectoId);

	return (
		<CasillasIds
			leyenda="Responsables"
			opciones={miembros.map((m) => ({ id: m.id, etiqueta: m.nombre }))}
			valor={valor}
			onChange={onChange}
		/>
	);
}
