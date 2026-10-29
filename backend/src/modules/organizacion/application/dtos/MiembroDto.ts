export interface MiembroDto {
	usuarioId: number;
	nombre: string;
	email: string;
	avatarUrl: string | null;
	isAdmin: boolean;
	/** ISO 8601: desde cuándo es miembro. */
	createdAt: string;
}
