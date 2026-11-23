/** Distingue un token personal de un JWT sin tocar la BD. */
export const PREFIJO_TOKEN_PERSONAL = "cfp_";
/** Refresh token de una conexión OAuth (MCP). */
export const PREFIJO_REFRESH_CONEXION = "cfr_";

export interface TokenPersonal {
	id: number;
	nombre: string;
	pista: string;
	createdAt: Date;
	/** null si no se ha usado desde que existe el campo. */
	ultimoUsoEn: Date | null;
}

/** Hashes y caducidad que identifican el acceso vigente de una conexión OAuth. */
export interface CredencialesConexion {
	tokenHash: string;
	pista: string;
	refreshHash: string;
	expiraEn: Date;
}

export interface TokenPersonalRepository {
	crear(data: {
		nombre: string;
		tokenHash: string;
		pista: string;
		usuarioId: number;
	}): Promise<TokenPersonal>;
	crearConexion(
		data: CredencialesConexion & {
			nombre: string;
			usuarioId: number;
			clientId: string;
		},
	): Promise<void>;
	/** Los no revocados del usuario, los más recientes primero. */
	listar(usuarioId: number): Promise<TokenPersonal[]>;
	/** Solo si no está revocado ni caducado. */
	buscarPorHash(tokenHash: string): Promise<{
		id: number;
		usuarioId: number;
		ultimoUsoEn: Date | null;
	} | null>;
	marcarUso(id: number, en: Date): Promise<void>;
	/**
	 * Cambia el acceso y el refresh token de la conexión cuyo refresh vigente es
	 * `refreshHash` y es de `clientId`. Atómico: un refresh ya usado no vale dos veces.
	 * Devuelve el usuario, o `null` si no hay conexión viva con ese refresh.
	 */
	rotar(
		refreshHash: string,
		clientId: string,
		nuevas: CredencialesConexion,
	): Promise<number | null>;
	/** `false` si no existe, ya estaba revocado o es de otro usuario. */
	revocar(id: number, usuarioId: number): Promise<boolean>;
	/** Revoca las conexiones OAuth sin uso (ni creación) desde `antesDe`. */
	revocarConexionesSinUso(antesDe: Date): Promise<number>;
}
