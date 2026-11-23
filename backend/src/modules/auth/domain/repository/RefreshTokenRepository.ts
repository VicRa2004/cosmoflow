/**
 * Contrato de repositorio para la gestión de Refresh Tokens.
 * Define las operaciones de persistencia sin acoplarse a la infraestructura.
 */
export interface RefreshTokenRepository {
	/**
	 * Persiste un nuevo refresh token (hash) asociado a un usuario.
	 */
	crear(data: {
		tokenHash: string;
		usuarioId: number;
		expiraEn: Date;
	}): Promise<void>;

	/**
	 * Busca un refresh token activo (no revocado y no expirado) por su hash.
	 * @returns Los datos del token o null si no existe / está inválido.
	 */
	buscarValidoPorHash(
		tokenHash: string,
	): Promise<{ id: number; usuarioId: number; expiraEn: Date } | null>;

	/**
	 * Revoca un token específico por su ID de forma atómica.
	 * @returns `false` si ya estaba revocado (otra petición lo usó antes).
	 */
	revocarPorId(id: number): Promise<boolean>;

	/**
	 * Adelanta la caducidad de un token a `fecha` (si caducaba después).
	 * Rotación con margen: el token usado sigue valiendo hasta entonces.
	 */
	caducarEn(id: number, fecha: Date): Promise<void>;

	/**
	 * Revoca todos los refresh tokens de un usuario (logout global / compromiso de cuenta).
	 */
	revocarTodosPorUsuarioId(usuarioId: number): Promise<void>;

	/**
	 * Elimina tokens expirados (revocados o no) de la base de datos (limpieza periódica).
	 */
	eliminarExpirados(): Promise<void>;

	/**
	 * Lista las sesiones activas (no revocadas y no expiradas) de un usuario.
	 */
	listarActivosPorUsuario(usuarioId: number): Promise<
		{
			id: number;
			tokenHash: string;
			createdAt: Date;
			expiraEn: Date;
		}[]
	>;

	/**
	 * Busca un refresh token por su ID y dueño.
	 */
	buscarPorIdYUsuario(
		id: number,
		usuarioId: number,
	): Promise<{
		id: number;
		tokenHash: string;
		revocado: boolean;
		expiraEn: Date;
	} | null>;
}
