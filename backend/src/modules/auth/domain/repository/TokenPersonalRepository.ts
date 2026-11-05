/** Distingue un token personal de un JWT sin tocar la BD. */
export const PREFIJO_TOKEN_PERSONAL = "cfp_";

export interface TokenPersonal {
	id: number;
	nombre: string;
	pista: string;
	createdAt: Date;
}

export interface TokenPersonalRepository {
	crear(data: {
		nombre: string;
		tokenHash: string;
		pista: string;
		usuarioId: number;
	}): Promise<TokenPersonal>;
	/** Los no revocados del usuario, los más recientes primero. */
	listar(usuarioId: number): Promise<TokenPersonal[]>;
	buscarUsuarioIdPorHash(tokenHash: string): Promise<number | null>;
	/** `false` si no existe, ya estaba revocado o es de otro usuario. */
	revocar(id: number, usuarioId: number): Promise<boolean>;
}
