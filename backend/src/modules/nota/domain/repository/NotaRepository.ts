import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { Nota } from "../Nota";

export interface NotaFiltros {
	pagina: number;
	limite: number;
	/** Texto en el título o el contenido, sin distinguir mayúsculas. */
	busqueda?: string;
	tagId?: number;
}

/**
 * Todas las lecturas van acotadas al dueño (`usuarioId`) e ignoran las borradas:
 * la nota de otro usuario no existe para quien la pide (404).
 */
export interface NotaRepository {
	/** Las editadas más recientemente primero. */
	buscar: (
		usuarioId: number,
		filtros: NotaFiltros,
	) => Promise<Paginacion<Nota>>;
	buscarPorId: (usuarioId: number, id: number) => Promise<Nota | null>;
	/** `true` si todos son tags vivos (no borrados) del usuario. */
	sonTagsPropios: (usuarioId: number, tagIds: number[]) => Promise<boolean>;
	crear: (data: Nota) => Promise<Nota>;
	actualizar: (data: Nota) => Promise<Nota>;
	/** Borrado lógico (`deletedAt`). */
	eliminar: (id: number) => Promise<void>;
}
