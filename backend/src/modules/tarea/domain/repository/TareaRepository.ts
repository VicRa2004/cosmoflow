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

/**
 * Todas las lecturas van acotadas al dueño (`usuarioId`) e ignoran las borradas:
 * la tarea de otro usuario no existe para quien la pide (404).
 */
export interface TareaRepository {
	buscar: (
		usuarioId: number,
		filtros: TareaFiltros,
	) => Promise<Paginacion<Tarea>>;
	buscarPorId: (usuarioId: number, id: number) => Promise<Tarea | null>;
	/** `true` si todos son tags vivos (no borrados) del usuario. */
	sonTagsPropios: (usuarioId: number, tagIds: number[]) => Promise<boolean>;
	crear: (data: Tarea) => Promise<Tarea>;
	actualizar: (data: Tarea) => Promise<Tarea>;
	/** Borrado lógico (`deletedAt`). */
	eliminar: (id: number) => Promise<void>;
}
