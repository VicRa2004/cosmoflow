import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { Nota } from "../Nota";

export interface NotaFiltros {
	pagina: number;
	limite: number;
	/** Texto en el título o el contenido, sin distinguir mayúsculas. */
	busqueda?: string;
	tagId?: number;
	fijada?: boolean;
	/** Solo las que están directamente en esa carpeta. */
	carpetaId?: number;
	/** Título exacto, sin distinguir mayúsculas (resuelve los wikilinks). */
	titulo?: string;
	creadaDesde?: Date;
	creadaHasta?: Date;
	editadaDesde?: Date;
	editadaHasta?: Date;
}

export type NotaIndiceFiltros = Omit<
	NotaFiltros,
	"pagina" | "limite" | "carpetaId" | "titulo"
>;

/** Una nota sin su contenido. */
export interface NotaIndice {
	id: number;
	titulo: string;
	color: string | null;
	carpetaId: number | null;
	isFijada: boolean;
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
	/** Como `buscar`, pero todas y sin contenido. */
	buscarIndice: (
		ambito: AmbitoNotas,
		filtros: NotaIndiceFiltros,
	) => Promise<NotaIndice[]>;
	buscarPorId: (id: number) => Promise<Nota | null>;
	/** Las borradas que el usuario aún vería, las borradas más recientemente primero. */
	buscarPapelera: (
		usuarioId: number,
		paginacion: { pagina: number; limite: number },
	) => Promise<Paginacion<Nota>>;
	/** Solo si está borrada (en la papelera). */
	buscarEliminadaPorId: (id: number) => Promise<Nota | null>;
	/** La saca de la papelera; si su carpeta ya no existe, vuelve a la raíz. */
	restaurar: (id: number) => Promise<void>;
	/** Borrado físico: sus tags caen en cascada. */
	eliminarDefinitivo: (id: number) => Promise<void>;
	/** Borra físicamente las que llevan en la papelera desde antes de `antesDe`. */
	purgarEliminadas: (antesDe: Date) => Promise<number>;
	/** `true` si todos son tags vivos (no borrados) de ese dueño. */
	sonTagsDe: (
		dueno: { usuarioId: number } | { organizacionId: number },
		tagIds: number[],
	) => Promise<boolean>;
	/** `true` si es una carpeta viva de ese ámbito. */
	esCarpetaDe: (ambito: AmbitoNotas, carpetaId: number) => Promise<boolean>;
	crear: (data: Nota) => Promise<Nota>;
	actualizar: (data: Nota) => Promise<Nota>;
	/** Borrado lógico (`deletedAt`). */
	eliminar: (id: number) => Promise<void>;
	/** Al eliminar el proyecto, sus notas pasan a quien las creó, sin los tags de la organización ni carpeta. */
	hacerPersonales: (proyectoId: number) => Promise<void>;
}
