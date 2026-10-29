import { useEquiposQuery } from "@/modules/equipos/hooks/useEquipos";
import { CasillasIds } from "@/modules/equipos/components/CasillasIds";
import { useMiembrosQuery } from "@/modules/organizaciones/hooks/useMiembros";
import { useProyectosQuery } from "@/modules/proyectos/hooks/useProyectos";

interface CampoResponsablesProps {
	organizacionId: number;
	equipoId?: number | null;
	proyectoId?: number | null;
	valor: number[];
	onChange: (valor: number[]) => void;
}

/**
 * Responsables entre los miembros del equipo, o de los equipos e integrantes del
 * proyecto (RN-23, 44). Solo para tareas compartidas.
 */
export function CampoResponsables({
	organizacionId,
	equipoId,
	proyectoId,
	valor,
	onChange,
}: CampoResponsablesProps) {
	const { data: miembros = [] } = useMiembrosQuery(organizacionId);
	const { data: equipos = [] } = useEquiposQuery(organizacionId);
	const { data: proyectos = [] } = useProyectosQuery(organizacionId);
	const proyecto = proyectos.find((p) => p.id === proyectoId);
	const equipoIds = equipoId ? [equipoId] : (proyecto?.equipoIds ?? []);
	const posibles = new Set([
		...equipos
			.filter((e) => equipoIds.includes(e.id))
			.flatMap((e) => e.miembros.map((m) => m.usuarioId)),
		...(proyecto?.integranteIds ?? []),
	]);

	return (
		<CasillasIds
			leyenda="Responsables"
			opciones={miembros
				.filter((m) => posibles.has(m.usuarioId))
				.map((m) => ({ id: m.usuarioId, etiqueta: m.nombre }))}
			valor={valor}
			onChange={onChange}
		/>
	);
}
