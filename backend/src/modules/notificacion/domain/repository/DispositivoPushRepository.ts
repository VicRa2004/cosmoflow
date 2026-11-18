export const PLATAFORMAS_PUSH = ["android", "ios"] as const;
export type PlataformaPush = (typeof PLATAFORMAS_PUSH)[number];

export interface DispositivoPushRepository {
	/** Registra el token o lo reasigna al usuario actual si ya existía en otra cuenta. */
	registrar(
		usuarioId: number,
		token: string,
		plataforma: PlataformaPush,
	): Promise<void>;
	/** Da de baja el token si pertenece al usuario. */
	eliminar(usuarioId: number, token: string): Promise<void>;
	/** Limpia un token que el proveedor push marcó como inválido o dado de baja. */
	eliminarPorToken(token: string): Promise<void>;
	contar(usuarioId: number): Promise<number>;
}
