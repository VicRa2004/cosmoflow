/**
 * Lo que otros módulos exigen antes de que alguien salga o sea expulsado de la
 * organización (equipos: RN-26). Lanza un error de dominio si no puede salir.
 */
export interface SalidaMiembro {
	comprobar: (organizacionId: number, usuarioId: number) => Promise<void>;
}
