import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { Miembro } from "../Miembro";
import type { Organizacion } from "../Organizacion";

export interface OrganizacionFiltros {
	pagina: number;
	limite: number;
	nombre?: string;
	/** `recientes`: en las que entró hace menos primero. Por defecto, por nombre. */
	orden?: "nombre" | "recientes";
}

/** Una organización vista por uno de sus miembros. */
export interface OrganizacionDelMiembro {
	organizacion: Organizacion;
	isAdmin: boolean;
	/** Unión de los permisos de sus roles vivos; ver `permisosEfectivos`. */
	permisos: string[];
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
	/** `true` si el usuario vivo con ese email ya es miembro. */
	esMiembroPorEmail: (
		organizacionId: number,
		email: string,
	) => Promise<boolean>;
	/** No hace nada si ya lo es. */
	agregarMiembro: (organizacionId: number, usuarioId: number) => Promise<void>;
	/** Miembros con usuario vivo: el admin primero y luego por nombre. */
	buscarMiembros: (organizacionId: number) => Promise<Miembro[]>;
	quitarMiembro: (organizacionId: number, usuarioId: number) => Promise<void>;
	/** Pasa el puesto de administrador de un miembro a otro (RN-11). */
	delegarAdministracion: (
		organizacionId: number,
		deUsuarioId: number,
		aUsuarioId: number,
	) => Promise<void>;
	/** Borrado lógico (`deletedAt`). */
	eliminar: (id: number) => Promise<void>;
}
