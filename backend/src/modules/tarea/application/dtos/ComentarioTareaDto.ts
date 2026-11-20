export interface ComentarioTareaDto {
	id: number;
	tareaId: number;
	autorId: number;
	autorNombre: string;
	contenido: string;
	createdAt: string;
	editadoEn: string | null;
}
