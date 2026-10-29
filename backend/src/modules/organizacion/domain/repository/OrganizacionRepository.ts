import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { Organizacion } from "../Organizacion";

export interface OrganizacionFiltros {
	pagina: number;
	limite: number;
	nombre?: string;
}

/** Una organización vista por uno de sus miembros. */
export interface OrganizacionDelMiembro {
	organizacion: Organizacion;
	isAdmin: boolean;
}

/**
 * Las lecturas van acotadas a las organizaciones de las que `usuarioId` es miembro
 * e ignoran las borradas: para quien no es miembro, la organización no existe (404, RN-90).
 */
export interface OrganizacionRepository {
	buscar: (
		usuarioId: number,
		filtros: OrganizacionFiltros,
	) => Promise<Paginacion<OrganizacionDelMiembro>>;
	buscarPorId: (
		usuarioId: number,
		id: number,
	) => Promise<OrganizacionDelMiembro | null>;
	/** Crea la organización con `adminId` como primer miembro y administrador (RN-10, RN-11). */
	crear: (data: Organizacion, adminId: number) => Promise<Organizacion>;
	actualizar: (data: Organizacion) => Promise<Organizacion>;
	/** Borrado lógico (`deletedAt`). */
	eliminar: (id: number) => Promise<void>;
}
