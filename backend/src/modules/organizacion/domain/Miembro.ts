/** Miembro de una organización tal como lo ven los demás (lectura, sin comportamiento). */
export interface Miembro {
	usuarioId: number;
	nombre: string;
	email: string;
	/** Clave del avatar del usuario. */
	avatar: string | null;
	isAdmin: boolean;
	/** Desde cuándo es miembro. */
	createdAt: Date;
}
