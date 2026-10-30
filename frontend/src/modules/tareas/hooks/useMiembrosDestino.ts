import { useEquiposQuery } from "@/modules/equipos/hooks/useEquipos";
import { useMiembrosQuery } from "@/modules/organizaciones/hooks/useMiembros";
import { useProyectosQuery } from "@/modules/proyectos/hooks/useProyectos";

/**
 * Quienes ven una tarea compartida (RN-23): los miembros del equipo, de los equipos e
 * integrantes del proyecto, o de toda la organización si no hay ninguno. Pueden ser
 * responsables y ser mencionados. Vacía mientras carga.
 */
export function useMiembrosDestino(
	organizacionId: number,
	equipoId?: number | null,
	proyectoId?: number | null,
): { id: number; nombre: string }[] {
	const { data: miembros = [] } = useMiembrosQuery(organizacionId);
	const { data: equipos = [] } = useEquiposQuery(organizacionId);
	const { data: proyectos = [] } = useProyectosQuery(organizacionId);
	const proyecto = proyectos.find((p) => p.id === proyectoId);
	const equipoIds = equipoId ? [equipoId] : (proyecto?.equipoIds ?? []);
	const deOrganizacion = !equipoId && !proyectoId;
	const posibles = new Set([
		...equipos
			.filter((e) => equipoIds.includes(e.id))
			.flatMap((e) => e.miembros.map((m) => m.usuarioId)),
		...(proyecto?.integranteIds ?? []),
	]);
	return miembros
		.filter((m) => deOrganizacion || posibles.has(m.usuarioId))
		.map((m) => ({ id: m.usuarioId, nombre: m.nombre }));
}
