/** Token secreto del feed iCalendar de un usuario (#173), guardado como hash. */
export interface SuscripcionCalendarioRepository {
	/** Crea o sustituye el token del usuario: la URL anterior deja de valer. */
	guardar(usuarioId: number, tokenHash: string): Promise<void>;
	eliminar(usuarioId: number): Promise<void>;
	/** Fecha de alta del token vigente, o `null` si no hay. */
	creadaEn(usuarioId: number): Promise<Date | null>;
	buscarUsuarioPorHash(tokenHash: string): Promise<number | null>;
}
