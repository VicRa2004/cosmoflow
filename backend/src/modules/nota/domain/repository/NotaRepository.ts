import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { Nota } from "../Nota";

export interface NotaFiltros {
	pagina: number;
	limite: number;
	/** Texto en el título o el contenido, sin distinguir mayúsculas. */
	busqueda?: string;
	tagId?: number;
}

/** Las personales de un usuario o las de un proyecto. */
export type AmbitoNotas = { usuarioId: number } | { proyectoId: number };

/**
 * Las lecturas ignoran las borradas. Quién puede ver cada nota lo decide la
 * aplicación (`buscarNotaVisible`): `buscarPorId` no filtra por usuario.
 */
export interface NotaRepository {
	/** Las editadas más recientemente primero. */
	buscar: (
		ambito: AmbitoNotas,
		filtros: NotaFiltros,
	) => Promise<Paginacion<Nota>>;
	buscarPorId: (id: number) => Promise<Nota | null>;
	/** `true` si todos son tags vivos (no borrados) de ese dueño. */
	sonTagsDe: (
		dueno: { usuarioId: number } | { organizacionId: number },
		tagIds: number[],
	) => Promise<boolean>;
	crear: (data: Nota) => Promise<Nota>;
	actualizar: (data: Nota) => Promise<Nota>;
	/** Borrado lógico (`deletedAt`). */
	eliminar: (id: number) => Promise<void>;
}
