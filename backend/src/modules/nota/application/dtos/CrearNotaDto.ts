export interface CamposNotaDto {
	titulo: string;
	contenido?: string;
	tagIds?: number[];
}

/** Sin `proyectoId`, personal. */
export interface CrearNotaDto extends CamposNotaDto {
	proyectoId?: number;
}
