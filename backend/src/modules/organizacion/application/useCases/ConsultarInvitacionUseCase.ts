import type { InvitacionRepository } from "../../domain/repository/InvitacionRepository";
import type { InvitacionRecibidaDto } from "../dtos/InvitacionDto";
import { buscarInvitacionRecibida } from "./buscarInvitacionRecibida";

export class ConsultarInvitacionUseCase {
	constructor(private readonly invitacionRepository: InvitacionRepository) {}

	async ejecutar(email: string, token: string): Promise<InvitacionRecibidaDto> {
		const { invitacion, nombreOrganizacion } = await buscarInvitacionRecibida(
			this.invitacionRepository,
			email,
			token,
		);
		return {
			nombreOrganizacion,
			email: invitacion.getEmail(),
			isVigente: invitacion.isVigente(),
		};
	}
}
