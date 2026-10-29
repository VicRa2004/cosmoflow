import type { InvitacionRepository } from "../../domain/repository/InvitacionRepository";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { InvitacionDto } from "../dtos/InvitacionDto";
import { InvitacionMapper } from "../mappers/InvitacionMapper";
import { buscarConPermiso } from "./buscarConPermiso";

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
		await buscarConPermiso(
			this.organizacionRepository,
			usuarioId,
			organizacionId,
			"miembros:invitar",
		);
		const pendientes =
			await this.invitacionRepository.buscarPendientes(organizacionId);
		return pendientes.map(InvitacionMapper.toDto);
	}
}
