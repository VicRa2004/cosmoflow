import type { InvitacionRepository } from "../../domain/repository/InvitacionRepository";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { InvitacionDto } from "../dtos/InvitacionDto";
import { InvitacionMapper } from "../mappers/InvitacionMapper";
import { buscarComoAdmin } from "./buscarComoAdmin";

/** Invitaciones pendientes de la organización. Solo el administrador. */
export class ObtenerInvitacionesUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly invitacionRepository: InvitacionRepository,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
	): Promise<InvitacionDto[]> {
		await buscarComoAdmin(
			this.organizacionRepository,
			usuarioId,
			organizacionId,
		);
		const pendientes =
			await this.invitacionRepository.buscarPendientes(organizacionId);
		return pendientes.map(InvitacionMapper.toDto);
	}
}
