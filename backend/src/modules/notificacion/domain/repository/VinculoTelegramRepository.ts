export interface VinculoTelegramRepository {
	estaVinculado(usuarioId: number): Promise<boolean>;
	/** Token nuevo del enlace (sustituye al anterior); un vínculo previo sigue hasta usarlo. */
	guardarToken(
		usuarioId: number,
		tokenHash: string,
		expiraEn: Date,
	): Promise<void>;
	/**
	 * Vincula el chat a quien tenga ese token sin caducar y lo consume. El chat deja de
	 * estar vinculado a otra cuenta. `false` si el token no existe o caducó.
	 */
	vincularPorToken(tokenHash: string, chatId: string): Promise<boolean>;
	desvincular(usuarioId: number): Promise<void>;
}
