import type { DatosNota } from "../../domain/Nota";

export interface NotaDto extends DatosNota {
	id: number;
	/** ISO 8601 de la última edición. */
	updatedAt: string;
}
