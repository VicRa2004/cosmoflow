import { useAuthStore } from "@/core/auth/store";
import { useEquiposQuery } from "@/modules/equipos/hooks/useEquipos";
import { useProyectosQuery } from "@/modules/proyectos/hooks/useProyectos";

/**
 * Equipos y proyectos de una organización cuyas tareas ve quien pide (RN-23), y si
 * puede crear y asignar en cada destino (RN-22). Vacíos mientras cargan.
 */
export function useDestinosTareas(organizacionId: number) {
	const yo = useAuthStore((s) => s.usuario?.id);
	const { data: equipos = [] } = useEquiposQuery(organizacionId);
	const { data: proyectos = [] } = useProyectosQuery(organizacionId);
	const misEquipos = equipos.filter((e) =>
		e.miembros.some((m) => m.usuarioId === yo),
	);
	const miembroDe = new Set(misEquipos.map((e) => e.id));
	const misProyectos = proyectos.filter(
		(p) =>
			(yo !== undefined && p.integranteIds.includes(yo)) ||
			p.equipoIds.some((id) => miembroDe.has(id)),
	);
	// Mismo criterio que el backend: sin líder, cualquier miembro; si no, líder o delegado.
	const gestionaEquipo = (equipoId: number) =>
		misEquipos.some(
			(e) =>
				e.id === equipoId &&
				(e.liderId === null ||
					e.liderId === yo ||
					e.miembros.some((m) => m.usuarioId === yo && m.puedeCrearTareas)),
		);

	return {
		equipos: misEquipos,
		proyectos: misProyectos,
		/** En la organización sola y en proyectos, cualquier miembro (decisión 21). */
		puedeCrearEn: ({ equipoId }: { equipoId?: number | null }) =>
			equipoId ? gestionaEquipo(equipoId) : true,
	};
}
