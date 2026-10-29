import type { InvitacionRepository } from "../../domain/repository/InvitacionRepository";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { InvitacionDto } from "../dtos/InvitacionDto";
import { InvitacionMapper } from "../mappers/InvitacionMapper";
import type { EmisorInvitaciones } from "../services/EmisorInvitaciones";
import { buscarInvitacionPendiente } from "./buscarInvitacionPendiente";

/** Token y caducidad nuevos: el enlace anterior deja de valer. */
export class ReenviarInvitacionUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly invitacionRepository: InvitacionRepository,
		private readonly emisor: EmisorInvitaciones,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
		id: number,
	): Promise<InvitacionDto> {
		const { organizacion, invitacion } = await buscarInvitacionPendiente(
			{
				organizaciones: this.organizacionRepository,
				invitaciones: this.invitacionRepository,
			},
			usuarioId,
			organizacionId,
			id,
		);
		const { token, tokenHash, expiraEn } = this.emisor.nuevoToken();
		invitacion.renovar(tokenHash, expiraEn);
		const guardada = await this.invitacionRepository.actualizar(invitacion);
		await this.emisor.enviar(
			guardada.getEmail(),
			organizacion.getNombre(),
			token,
		);
		return InvitacionMapper.toDto(guardada);
	}
}
