import type { CarpetaNota } from "../CarpetaNota";
import type { AmbitoNotas } from "./NotaRepository";

/** Las lecturas ignoran las borradas; quién ve cada una lo decide la aplicación. */
export interface CarpetaNotaRepository {
	/** Todas las del ámbito, por nombre (el árbol lo arma el cliente). */
	buscar: (ambito: AmbitoNotas) => Promise<CarpetaNota[]>;
	buscarPorId: (id: number) => Promise<CarpetaNota | null>;
	crear: (data: CarpetaNota) => Promise<CarpetaNota>;
	actualizar: (data: CarpetaNota) => Promise<CarpetaNota>;
	/** Borrado lógico; sus subcarpetas y notas suben a su padre (no se pierde nada). */
	eliminar: (id: number) => Promise<void>;
}
