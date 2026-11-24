/** Estado de la verificación en dos pasos de un usuario; el secreto llega ya descifrado. */
export interface DosPasos {
	secreto: string;
	isActivo: boolean;
	codigosRestantes: number;
}

/** Verificación en dos pasos (TOTP). El adaptador guarda el secreto cifrado. */
export interface DosPasosRepository {
	obtener(usuarioId: number): Promise<DosPasos | null>;

	/** Guarda un secreto sin confirmar (reemplaza uno anterior sin activar). */
	guardarPendiente(usuarioId: number, secreto: string): Promise<void>;

	/** Activa la verificación con el paso del primer código y los hashes de los códigos de recuperación. */
	activar(
		usuarioId: number,
		paso: number,
		codigosHash: string[],
	): Promise<void>;

	/**
	 * Registra el paso de un código aceptado, de forma atómica.
	 * @returns `false` si ese paso (o uno posterior) ya se usó: código repetido.
	 */
	marcarPaso(usuarioId: number, paso: number): Promise<boolean>;

	/** @returns `true` si el código de recuperación existía sin usar (queda usado). */
	consumirCodigoRecuperacion(
		usuarioId: number,
		codigoHash: string,
	): Promise<boolean>;

	/** Desactiva: borra el secreto y los códigos de recuperación. */
	eliminar(usuarioId: number): Promise<void>;
}
