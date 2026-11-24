export interface ResultadosBusqueda {
	tareas: { id: number; titulo: string }[];
	notas: { id: number; titulo: string }[];
	proyectos: { id: number; nombre: string; organizacionId: number }[];
	equipos: { id: number; nombre: string; organizacionId: number }[];
}

/**
 * Busca sin distinguir mayúsculas solo entre lo que el usuario ve en los listados:
 * tareas (título y contenido) y notas (título y contenido) no borradas, y proyectos
 * y equipos de sus organizaciones (todos si es admin; si no, donde está).
 */
export interface BusquedaRepository {
	buscar: (
		usuarioId: number,
		texto: string,
		limite: number,
	) => Promise<ResultadosBusqueda>;
}
