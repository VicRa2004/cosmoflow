import type { Equipo } from "../../domain/Equipo";
import type { EquipoDto } from "../dtos/EquipoDto";

export const EquipoMapper = {
	toDto(equipo: Equipo): EquipoDto {
		const avatar = equipo.getAvatar();
		return {
			id: equipo.getId(),
			nombre: equipo.getNombre(),
			descripcion: equipo.getDescripcion(),
			color: equipo.getColor(),
			// La clave en `?v=` cambia con cada subida: la caché no sirve la vieja.
			avatarUrl: avatar
				? `/api/organizaciones/${equipo.getOrganizacionId()}/equipos/${equipo.getId()}/avatar?v=${encodeURIComponent(avatar)}`
				: null,
			liderId: equipo.getLiderId(),
			miembros: equipo.getMiembros().map((m) => ({ ...m })),
			tagIds: [...equipo.getTagIds()],
		};
	},
};
