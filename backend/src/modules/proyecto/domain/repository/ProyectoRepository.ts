import type { EstadoProyecto, Proyecto } from "../Proyecto";

export interface ProyectoRepository {
	buscar(
		organizacionId: number,
		filtro: { estado?: EstadoProyecto },
	): Promise<Proyecto[]>;
	buscarPorId(organizacionId: number, id: number): Promise<Proyecto | null>;
	crear(proyecto: Proyecto): Promise<Proyecto>;
	actualizar(proyecto: Proyecto): Promise<Proyecto>;
	eliminar(organizacionId: number, id: number): Promise<void>;
	/** Todos son equipos vivos de la organización. */
	sonEquipos(organizacionId: number, equipoIds: number[]): Promise<boolean>;
	/** Todos son miembros de la organización. */
	sonMiembros(organizacionId: number, usuarioIds: number[]): Promise<boolean>;
	/** Nombres de los proyectos cuyo único equipo es este. */
	proyectosSoloCon(organizacionId: number, equipoId: number): Promise<string[]>;
}
