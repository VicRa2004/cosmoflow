export interface NotaImportada {
	/** Ruta de carpetas desde el destino (`["Viajes", "Europa"]`); vacía, en el destino. */
	carpeta: string[];
	titulo: string;
	contenido: string;
}

/** Sin `proyectoId`, personales; sin `carpetaId`, en la raíz. */
export interface ImportarNotasDto {
	proyectoId?: number;
	carpetaId?: number;
	notas: NotaImportada[];
}

export interface ResultadoImportacionDto {
	notas: number;
	carpetas: number;
}
