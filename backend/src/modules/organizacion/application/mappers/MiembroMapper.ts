import type { Miembro } from "../../domain/Miembro";
import type { MiembroDto } from "../dtos/MiembroDto";

export const MiembroMapper = {
	toDto({ avatar, createdAt, ...miembro }: Miembro): MiembroDto {
		return {
			...miembro,
			// Misma URL que da `UsuarioMapper` para el avatar del usuario.
			avatarUrl: avatar
				? `/api/avatares/${miembro.usuarioId}?v=${encodeURIComponent(avatar)}`
				: null,
			createdAt: createdAt.toISOString(),
		};
	},
};
