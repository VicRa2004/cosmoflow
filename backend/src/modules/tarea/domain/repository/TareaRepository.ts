import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { EstadoTarea, Tarea } from "../Tarea";

export interface TareaFiltros {
	pagina: number;
	limite: number;
	/** Texto en el título, sin distinguir mayúsculas. */
	busqueda?: string;
	estado?: EstadoTarea;
	tagId?: number;
}

/** Las personales de un usuario, o las de una organización (sin equipo ni proyecto), equipo o proyecto. */
export type AmbitoTareas =
	| { usuarioId: number }
	| { organizacionId: number }
	| { equipoId: number }
	| { proyectoId: number };

/** Un equipo o un proyecto concreto. */
export type GrupoTareas = { equipoId: number } | { proyectoId: number };

/**
 * Las lecturas ignoran las borradas. Quién puede ver cada tarea lo decide la
 * aplicación (`buscarTareaVisible`): aquí no hay filtro por usuario en `buscarPorId`.
 */
export interface TareaRepository {
	buscar: (
		ambito: AmbitoTareas,
		filtros: TareaFiltros,
	) => Promise<Paginacion<Tarea>>;
	/**
	 * Pendientes y en progreso (RN-43) personales del usuario o en las que es
	 * responsable: vencimiento más próximo primero, sin fecha al final; a igual
	 * fecha, más prioridad primero.
	 */
	buscarPendientes: (
		usuarioId: number,
		paginacion: { pagina: number; limite: number },
	) => Promise<Paginacion<Tarea>>;
	buscarPorId: (id: number) => Promise<Tarea | null>;
	/** `true` si todos son tags vivos (no borrados) de ese dueño. */
	sonTagsDe: (
		dueno: { usuarioId: number } | { organizacionId: number },
		tagIds: number[],
	) => Promise<boolean>;
	crear: (data: Tarea) => Promise<Tarea>;
	actualizar: (data: Tarea) => Promise<Tarea>;
	/** Borrado lógico (`deletedAt`). */
	eliminar: (id: number) => Promise<void>;
	/** Al eliminar el equipo o proyecto, sus tareas quedan en la organización. */
	pasarAOrganizacion: (grupo: GrupoTareas) => Promise<void>;
	/**
	 * Quita como responsables a quienes ya no ven la tarea (RN-23). Con un equipo, en
	 * sus tareas y en las de los proyectos en los que está.
	 */
	depurarResponsables: (grupo: GrupoTareas) => Promise<void>;
}
