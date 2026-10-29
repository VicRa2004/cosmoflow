import type { Equipo } from "../Equipo";

export interface EquipoRepository {
	buscar(organizacionId: number, filtro: { tagId?: number }): Promise<Equipo[]>;
	buscarPorId(organizacionId: number, id: number): Promise<Equipo | null>;
	crear(equipo: Equipo): Promise<Equipo>;
	actualizar(equipo: Equipo): Promise<Equipo>;
	eliminar(organizacionId: number, id: number): Promise<void>;
	/** Todos son miembros de la organización. */
	sonMiembros(organizacionId: number, usuarioIds: number[]): Promise<boolean>;
	/** Todos son tags vivos de la organización (RN-60). */
	sonTags(organizacionId: number, tagIds: number[]): Promise<boolean>;
	/** Nombres de los equipos del usuario que tienen solo 2 miembros. */
	equiposAlMinimo(organizacionId: number, usuarioId: number): Promise<string[]>;
}
