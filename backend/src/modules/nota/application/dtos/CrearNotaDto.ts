export interface CamposNotaDto {
	titulo: string;
	contenido?: string;
	color?: string | null;
	tagIds?: number[];
	carpetaId?: number | null;
}

/** Sin `proyectoId`, personal. */
export interface CrearNotaDto extends CamposNotaDto {
	proyectoId?: number;
}
