/** Imagen subida por un usuario para usarla en tareas y notas. Su contenido no cambia. */
export interface Adjunto {
	id: number;
	usuarioId: number;
	/** Clave en el `Almacenamiento` (la genera el backend). */
	clave: string;
	tipo: string;
	bytes: number;
	/** Compartido con un equipo o proyecto: también lo ven sus miembros. */
	equipoId: number | null;
	proyectoId: number | null;
}

export type AmbitoAdjunto = { equipoId: number } | { proyectoId: number };
