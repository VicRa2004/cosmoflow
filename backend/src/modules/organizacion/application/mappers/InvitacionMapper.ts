import type { Invitacion } from "../../domain/Invitacion";
import type { InvitacionDto } from "../dtos/InvitacionDto";

export const InvitacionMapper = {
	toDto(invitacion: Invitacion): InvitacionDto {
		return {
			id: invitacion.getId(),
			email: invitacion.getEmail(),
			expiraEn: invitacion.getExpiraEn().toISOString(),
			isCaducada: !invitacion.isVigente(),
			createdAt: invitacion.getCreatedAt().toISOString(),
		};
	},
};
