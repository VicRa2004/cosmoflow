import { useEquiposQuery } from "@/modules/equipos/hooks/useEquipos";
import { useProyectosQuery } from "@/modules/proyectos/hooks/useProyectos";
import { useOrganizacionQuery } from "./useOrganizacionesQuery";

export interface ContextoCompartido {
	organizacionId: number;
	equipoId?: number | null;
	proyectoId?: number | null;
}

/**
 * Nombres de la organización y del equipo o proyecto de una tarea o nota compartida.
 * `grupo` es `undefined` mientras carga o si es de la organización sola.
 */
export function useNombresContexto({
	organizacionId,
	equipoId,
	proyectoId,
}: ContextoCompartido) {
	const { data: organizacion } = useOrganizacionQuery(organizacionId);
	const { data: equipos } = useEquiposQuery(organizacionId);
	const { data: proyectos } = useProyectosQuery(organizacionId);
	return {
		organizacion: organizacion?.nombre,
		grupo: equipoId
			? equipos?.find((e) => e.id === equipoId)?.nombre
			: proyectoId
				? proyectos?.find((p) => p.id === proyectoId)?.nombre
				: undefined,
	};
}
