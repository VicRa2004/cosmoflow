import type { ComentarioTarea } from "../../domain/repository/ComentarioTareaRepository";
import type { ComentarioTareaDto } from "../dtos/ComentarioTareaDto";

export const ComentarioTareaMapper = {
	toDto({ autorAvatar, ...comentario }: ComentarioTarea): ComentarioTareaDto {
		return {
			...comentario,
			autorAvatarUrl: autorAvatar
				? `/api/avatares/${comentario.autorId}?v=${encodeURIComponent(autorAvatar)}`
				: null,
			createdAt: comentario.createdAt.toISOString(),
			editadoEn: comentario.editadoEn?.toISOString() ?? null,
		};
	},
};
