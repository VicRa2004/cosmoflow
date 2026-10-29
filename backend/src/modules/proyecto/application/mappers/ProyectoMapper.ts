import type { Proyecto } from "../../domain/Proyecto";
import type { ProyectoDto } from "../dtos/ProyectoDto";

export const ProyectoMapper = {
	toDto(proyecto: Proyecto): ProyectoDto {
		return {
			id: proyecto.getId(),
			nombre: proyecto.getNombre(),
			descripcion: proyecto.getDescripcion(),
			estado: proyecto.getEstado(),
			equipoIds: [...proyecto.getEquipoIds()],
			integranteIds: [...proyecto.getIntegranteIds()],
		};
	},
};
