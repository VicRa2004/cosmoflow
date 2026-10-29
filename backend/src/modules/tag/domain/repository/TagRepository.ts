import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { DuenoTag, Tag } from "../Tag";

export interface TagFiltros {
	pagina: number;
	limite: number;
	nombre?: string;
}

/**
 * Todas las lecturas van acotadas al dueño e ignoran los borrados: el tag de otro
 * usuario u organización no existe para quien lo pide (404).
 */
export interface TagRepository {
	buscar: (dueno: DuenoTag, filtros: TagFiltros) => Promise<Paginacion<Tag>>;
	buscarPorId: (dueno: DuenoTag, id: number) => Promise<Tag | null>;
	/** Sin distinguir mayúsculas. */
	buscarPorNombre: (dueno: DuenoTag, nombre: string) => Promise<Tag | null>;
	crear: (data: Tag) => Promise<Tag>;
	actualizar: (data: Tag) => Promise<Tag>;
	/** Borrado lógico (`deletedAt`). */
	eliminar: (id: number) => Promise<void>;
}
