export interface MiembroDto {
	usuarioId: number;
	nombre: string;
	email: string;
	avatarUrl: string | null;
	isAdmin: boolean;
	roles: { id: number; nombre: string }[];
	/** ISO 8601: desde cuándo es miembro. */
	createdAt: string;
}
