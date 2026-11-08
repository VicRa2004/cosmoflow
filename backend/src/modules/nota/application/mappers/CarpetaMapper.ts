import type { CarpetaNota } from "../../domain/CarpetaNota";
import type { CarpetaDto } from "../dtos/CarpetaDto";

export const CarpetaMapper = {
	toDto(carpeta: CarpetaNota): CarpetaDto {
		const proyecto = carpeta.getProyecto();
		return {
			id: carpeta.getId(),
			...carpeta.getDatos(),
			organizacionId: proyecto?.organizacionId ?? null,
			proyectoId: proyecto?.proyectoId ?? null,
		};
	},
};
