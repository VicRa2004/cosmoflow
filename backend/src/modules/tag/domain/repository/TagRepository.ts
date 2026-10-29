import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { Tag } from "../Tag";

export interface TagFiltros {
	pagina: number;
	limite: number;
	nombre?: string;
}

/**
 * Todas las lecturas van acotadas al dueño (`usuarioId`) e ignoran los borrados:
 * el tag de otro usuario no existe para quien lo pide (404).
 */
export interface TagRepository {
	buscar: (usuarioId: number, filtros: TagFiltros) => Promise<Paginacion<Tag>>;
	buscarPorId: (usuarioId: number, id: number) => Promise<Tag | null>;
	/** Sin distinguir mayúsculas. */
	buscarPorNombre: (usuarioId: number, nombre: string) => Promise<Tag | null>;
	crear: (data: Tag) => Promise<Tag>;
	actualizar: (data: Tag) => Promise<Tag>;
	/** Borrado lógico (`deletedAt`). */
	eliminar: (id: number) => Promise<void>;
}
