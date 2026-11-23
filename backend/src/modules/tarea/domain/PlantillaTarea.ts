import type { PrioridadTarea } from "./Tarea";

/** De quién es una plantilla (#175): de un usuario o de una organización. */
export type DuenoPlantilla = { usuarioId: number } | { organizacionId: number };

/** Lo que una plantilla rellena al crear una tarea. */
export interface DatosPlantilla {
	nombre: string;
	titulo: string;
	contenido: string;
	prioridad: PrioridadTarea;
	color: string | null;
	/** Títulos de la checklist, en orden. */
	subtareas: string[];
}

export interface PlantillaTarea extends DatosPlantilla {
	id: number;
}
