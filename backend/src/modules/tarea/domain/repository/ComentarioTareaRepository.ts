import type { Paginacion } from "@/core/shared/domain/Paginacion";

export interface ComentarioTarea {
	id: number;
	tareaId: number;
	autorId: number;
	/** Para mostrarlo sin otra consulta: el autor puede no ser ya del contexto. */
	autorNombre: string;
	contenido: string;
	createdAt: Date;
	editadoEn: Date | null;
}

export interface ComentarioTareaRepository {
	/** Los más antiguos primero: se leen como una conversación. */
	listar: (
		tareaId: number,
		paginacion: { pagina: number; limite: number },
	) => Promise<Paginacion<ComentarioTarea>>;
	/** Solo si es de esa tarea. */
	buscarPorId: (tareaId: number, id: number) => Promise<ComentarioTarea | null>;
	crear: (datos: {
		tareaId: number;
		autorId: number;
		contenido: string;
	}) => Promise<ComentarioTarea>;
	actualizar: (id: number, contenido: string) => Promise<ComentarioTarea>;
	eliminar: (id: number) => Promise<void>;
}
