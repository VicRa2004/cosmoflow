/**
 * Lo que otros módulos exigen antes de eliminar un equipo (proyectos: RN-31).
 * Lanza un error de dominio si no se puede eliminar.
 */
export interface BajaEquipo {
	comprobar: (organizacionId: number, equipoId: number) => Promise<void>;
}
