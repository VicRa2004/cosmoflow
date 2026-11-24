/** Datos del usuario que viajan firmados en el access token. */
export interface AccessTokenPayload {
	id: number;
	email: string;
	roles: string[];
}

export interface TokenService {
	generarToken(payload: AccessTokenPayload): string;

	/**
	 * Verifica la firma y la expiración del access token.
	 * @throws si el token es inválido o expiró.
	 */
	verificarToken(token: string): AccessTokenPayload;

	/**
	 * Token intermedio del login en dos pasos (vida corta): prueba que la
	 * contraseña era correcta. Nunca vale como access token, ni al revés.
	 */
	generarTokenDosPasos(usuarioId: number): string;

	/**
	 * @returns el ID del usuario.
	 * @throws si el token es inválido o expiró.
	 */
	verificarTokenDosPasos(token: string): number;

	/**
	 * Genera un string aleatorio opaco para usar como refresh token.
	 */
	generarRefreshToken(): string;

	/**
	 * Genera un hash SHA-256 del refresh token para almacenarlo en BD.
	 * Nunca se persiste el token en claro.
	 */
	hashearRefreshToken(token: string): string;
}
