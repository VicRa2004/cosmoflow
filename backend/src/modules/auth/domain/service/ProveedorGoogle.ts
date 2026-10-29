export interface PerfilGoogle {
	/** `sub` del id_token: estable aunque el usuario cambie de email. */
	googleId: string;
	/** Siempre verificado por Google. */
	email: string;
	nombre: string;
}

/** OAuth 2.0 (código + PKCE) contra Google. */
export interface ProveedorGoogle {
	urlAutorizacion(state: string, codeVerifier: string): string;
	obtenerPerfil(code: string, codeVerifier: string): Promise<PerfilGoogle>;
}
