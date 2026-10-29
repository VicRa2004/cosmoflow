/** Imagen subida por un usuario para usarla en sus tareas y notas. Inmutable. */
export interface Adjunto {
	id: number;
	usuarioId: number;
	/** Clave en el `Almacenamiento` (la genera el backend). */
	clave: string;
	tipo: string;
	bytes: number;
}
