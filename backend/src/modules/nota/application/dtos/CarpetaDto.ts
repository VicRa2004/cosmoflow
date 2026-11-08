import type { DatosCarpeta } from "../../domain/CarpetaNota";

export interface CarpetaDto extends DatosCarpeta {
	id: number;
	/** Las personales, `null`. */
	organizacionId: number | null;
	proyectoId: number | null;
}

/** Sin `proyectoId`, personal. */
export interface CrearCarpetaDto {
	nombre: string;
	icono?: string | null;
	color?: string | null;
	padreId?: number | null;
	proyectoId?: number;
}

export type ActualizarCarpetaDto = Partial<DatosCarpeta>;
