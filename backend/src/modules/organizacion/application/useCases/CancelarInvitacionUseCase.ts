import type { InvitacionRepository } from "../../domain/repository/InvitacionRepository";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import { buscarInvitacionPendiente } from "./buscarInvitacionPendiente";

export class CancelarInvitacionUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly invitacionRepository: InvitacionRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
		id: number,
	): Promise<void> {
		const { invitacion } = await buscarInvitacionPendiente(
			{
				organizaciones: this.organizacionRepository,
				invitaciones: this.invitacionRepository,
			},
			usuarioId,
			organizacionId,
			id,
		);
		invitacion.responder("cancelada");
		await this.invitacionRepository.actualizar(invitacion);
	}
}
