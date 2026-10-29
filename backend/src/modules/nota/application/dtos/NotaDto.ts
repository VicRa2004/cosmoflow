import type { DatosNota } from "../../domain/Nota";

export interface NotaDto extends DatosNota {
	id: number;
	/** Las personales, `null`. */
	organizacionId: number | null;
	proyectoId: number | null;
	/** ISO 8601 de la última edición. */
	updatedAt: string;
}
