export interface CodigoOAuth {
	usuarioId: number;
	clientId: string;
	redirectUri: string;
	codeChallenge: string;
}

export interface CodigoOAuthRepository {
	guardar(
		codigo: CodigoOAuth & { codigoHash: string; expiraEn: Date },
	): Promise<void>;
	/** Lo borra y lo devuelve, de forma atómica: `null` si no existe, ya se usó o caducó. */
	consumir(codigoHash: string): Promise<CodigoOAuth | null>;
	eliminarCaducados(): Promise<void>;
}
