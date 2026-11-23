export interface ComentarioTareaDto {
	id: number;
	tareaId: number;
	autorId: number;
	autorNombre: string;
	autorAvatarUrl: string | null;
	padreId: number | null;
	contenido: string;
	createdAt: string;
	editadoEn: string | null;
}
