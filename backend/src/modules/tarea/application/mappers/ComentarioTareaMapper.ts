import type { ComentarioTarea } from "../../domain/repository/ComentarioTareaRepository";
import type { ComentarioTareaDto } from "../dtos/ComentarioTareaDto";

export const ComentarioTareaMapper = {
	toDto(comentario: ComentarioTarea): ComentarioTareaDto {
		return {
			...comentario,
			createdAt: comentario.createdAt.toISOString(),
			editadoEn: comentario.editadoEn?.toISOString() ?? null,
		};
	},
};
