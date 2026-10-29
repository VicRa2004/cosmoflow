import { permisosEfectivos } from "../../domain/permisosOrganizacion";
import type { OrganizacionDelMiembro } from "../../domain/repository/OrganizacionRepository";
import type { OrganizacionDto } from "../dtos/OrganizacionDto";

export const OrganizacionMapper = {
	toDto(miembro: OrganizacionDelMiembro): OrganizacionDto {
		const { organizacion, isAdmin } = miembro;
		const avatar = organizacion.getAvatar();
		return {
			id: organizacion.getId(),
			nombre: organizacion.getNombre(),
			descripcion: organizacion.getDescripcion(),
			color: organizacion.getColor(),
			// La clave en `?v=` cambia con cada subida: la caché no sirve la vieja.
			avatarUrl: avatar
				? `/api/organizaciones/${organizacion.getId()}/avatar?v=${encodeURIComponent(avatar)}`
				: null,
			isAdmin,
			permisos: permisosEfectivos(miembro),
		};
	},
};
