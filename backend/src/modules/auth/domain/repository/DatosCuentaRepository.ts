export interface TareaExportada {
	id: number;
	titulo: string;
	contenido: string;
	estado: string;
	prioridad: string;
	fechaInicio: Date | null;
	fechaVencimiento: Date | null;
	organizacionId: number | null;
	equipoId: number | null;
	proyectoId: number | null;
	subtareas: { titulo: string; completada: boolean }[];
	createdAt: Date;
	updatedAt: Date | null;
}

export interface NotaExportada {
	id: number;
	titulo: string;
	contenido: string;
	carpetaId: number | null;
	organizacionId: number | null;
	proyectoId: number | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface DatosExportados {
	tareas: TareaExportada[];
	notas: NotaExportada[];
	carpetas: { id: number; nombre: string; padreId: number | null }[];
}

/** Datos del propio usuario para exportarlos o darse de baja. */
export interface DatosCuentaRepository {
	/** Nombres de las organizaciones (no borradas) donde es el único administrador. */
	organizacionesSinOtroAdmin(usuarioId: number): Promise<string[]>;

	/**
	 * Borra lo personal (tareas, notas, carpetas, tags, plantillas, adjuntos,
	 * sesiones, tokens…), lo saca de sus organizaciones y anonimiza la fila del
	 * usuario. Lo compartido que creó se queda en su organización.
	 * @returns claves de archivos (avatar y adjuntos personales) a borrar del almacenamiento.
	 */
	darDeBaja(usuarioId: number): Promise<string[]>;

	/** Tareas y notas no borradas que creó (personales y compartidas) y sus carpetas. */
	exportar(usuarioId: number): Promise<DatosExportados>;
}
