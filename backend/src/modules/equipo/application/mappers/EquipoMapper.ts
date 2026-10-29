import type { Equipo } from "../../domain/Equipo";
import type { EquipoDto } from "../dtos/EquipoDto";

export const EquipoMapper = {
	toDto(equipo: Equipo): EquipoDto {
		return {
			id: equipo.getId(),
			nombre: equipo.getNombre(),
			descripcion: equipo.getDescripcion(),
			color: equipo.getColor(),
			liderId: equipo.getLiderId(),
			miembros: equipo.getMiembros().map((m) => ({ ...m })),
			tagIds: [...equipo.getTagIds()],
		};
	},
};
