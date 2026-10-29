import type { Tarea } from "../../domain/Tarea";
import type { TareaDto } from "../dtos/TareaDto";

export const TareaMapper = {
	toDto(tarea: Tarea): TareaDto {
		return {
			id: tarea.getId(),
			...tarea.getDatos(),
			...tarea.getUbicacion(),
			responsableIds: [...tarea.getResponsableIds()],
		};
	},
};
