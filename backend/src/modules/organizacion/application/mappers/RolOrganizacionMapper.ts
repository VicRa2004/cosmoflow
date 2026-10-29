import type { RolOrganizacion } from "../../domain/RolOrganizacion";
import type { RolOrganizacionDto } from "../dtos/RolOrganizacionDto";

export const RolOrganizacionMapper = {
	toDto(rol: RolOrganizacion, totalMiembros: number): RolOrganizacionDto {
		return {
			id: rol.getId(),
			nombre: rol.getNombre(),
			permisos: rol.getPermisos(),
			totalMiembros,
		};
	},
};
