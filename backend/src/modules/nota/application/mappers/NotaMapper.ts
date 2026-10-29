import type { Nota } from "../../domain/Nota";
import type { NotaDto } from "../dtos/NotaDto";

export const NotaMapper = {
	toDto(nota: Nota): NotaDto {
		const proyecto = nota.getProyecto();
		return {
			id: nota.getId(),
			...nota.getDatos(),
			organizacionId: proyecto?.organizacionId ?? null,
			proyectoId: proyecto?.proyectoId ?? null,
			updatedAt: nota.getUpdatedAt()?.toISOString() ?? "",
		};
	},
};
