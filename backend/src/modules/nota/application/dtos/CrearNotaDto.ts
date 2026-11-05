export interface CamposNotaDto {
	titulo: string;
	contenido?: string;
	color?: string | null;
	tagIds?: number[];
}

/** Sin `proyectoId`, personal. */
export interface CrearNotaDto extends CamposNotaDto {
	proyectoId?: number;
}
