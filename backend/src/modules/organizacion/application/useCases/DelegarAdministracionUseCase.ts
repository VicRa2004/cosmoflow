import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import { MiembroNoEncontradoError } from "../../domain/error/MiembroNoEncontradoError";
import { AdministracionDelegadaEvent } from "../../domain/event/AdministracionDelegadaEvent";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import { buscarComoAdmin } from "./buscarComoAdmin";

/** El admin cede su puesto a otro miembro y queda como miembro normal (RN-11). */
export class DelegarAdministracionUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
		aUsuarioId: number,
	): Promise<void> {
		await buscarComoAdmin(
			this.organizacionRepository,
			usuarioId,
			organizacionId,
		);
		if (aUsuarioId === usuarioId) return;
		if (
			!(await this.organizacionRepository.buscarPorId(
				aUsuarioId,
				organizacionId,
			))
		) {
			throw new MiembroNoEncontradoError();
		}

		await this.uow.ejecutar(async () => {
			await this.organizacionRepository.delegarAdministracion(
				organizacionId,
				usuarioId,
				aUsuarioId,
			);
			await this.eventBus.publish(
				new AdministracionDelegadaEvent({
					organizacionId,
					deUsuarioId: usuarioId,
					aUsuarioId,
				}),
			);
		});
	}
}
