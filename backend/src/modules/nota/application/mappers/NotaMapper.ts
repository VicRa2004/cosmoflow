import type { Nota } from "../../domain/Nota";
import type { NotaDto } from "../dtos/NotaDto";

export const NotaMapper = {
	toDto(nota: Nota): NotaDto {
		return {
			id: nota.getId(),
			...nota.getDatos(),
			updatedAt: nota.getUpdatedAt()?.toISOString() ?? "",
		};
	},
};
