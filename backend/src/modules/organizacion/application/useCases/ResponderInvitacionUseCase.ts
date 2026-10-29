import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import { InvitacionNoVigenteError } from "../../domain/error/InvitacionNoVigenteError";
import type { InvitacionRepository } from "../../domain/repository/InvitacionRepository";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import { buscarInvitacionRecibida } from "./buscarInvitacionRecibida";

/** Aceptar crea el miembro (RN-12); aceptar o rechazar gasta el enlace. */
export class ResponderInvitacionUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly invitacionRepository: InvitacionRepository,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		usuario: { id: number; email: string },
		token: string,
		aceptar: boolean,
	): Promise<{ organizacionId: number }> {
		const { invitacion } = await buscarInvitacionRecibida(
			this.invitacionRepository,
			usuario.email,
			token,
		);
		if (!invitacion.isVigente()) throw new InvitacionNoVigenteError();

		invitacion.responder(aceptar ? "aceptada" : "rechazada");
		await this.uow.ejecutar(async () => {
			if (aceptar) {
				await this.organizacionRepository.agregarMiembro(
					invitacion.getOrganizacionId(),
					usuario.id,
				);
			}
			await this.invitacionRepository.actualizar(invitacion);
		});
		return { organizacionId: invitacion.getOrganizacionId() };
	}
}
