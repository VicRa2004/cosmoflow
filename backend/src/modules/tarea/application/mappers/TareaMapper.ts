import type { Tarea } from "../../domain/Tarea";
import type { TareaDto } from "../dtos/TareaDto";

export const TareaMapper = {
	toDto(tarea: Tarea): TareaDto {
		const { subtareas, ...datos } = tarea.getDatos();
		return {
			id: tarea.getId(),
			...datos,
			subtareas: subtareas.map((sub, indice) => ({
				id: sub.id ?? indice + 1,
				titulo: sub.titulo,
				completada: sub.completada,
			})),
			...tarea.getUbicacion(),
			responsableIds: [...tarea.getResponsableIds()],
			asignadoPor: { ...tarea.getAsignadoPor() },
			bloqueada: tarea.isBloqueada(),
		};
	},
};
