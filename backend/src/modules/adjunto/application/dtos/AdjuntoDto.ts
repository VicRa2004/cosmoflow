export interface AdjuntoDto {
	id: number;
	/** Ruta para el markdown: `/api/adjuntos/{id}`. */
	url: string;
	tipo: string;
	bytes: number;
}
