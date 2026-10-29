import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import { AdminNoPuedeSalirError } from "../../domain/error/AdminNoPuedeSalirError";
import { MiembroNoEncontradoError } from "../../domain/error/MiembroNoEncontradoError";
import { OrganizacionNoEncontradaError } from "../../domain/error/OrganizacionNoEncontradaError";
import { SoloAdminOrganizacionError } from "../../domain/error/SoloAdminOrganizacionError";
import { MiembroQuitadoEvent } from "../../domain/event/MiembroQuitadoEvent";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";

/**
 * Con `objetivoId` = quien pide, sale de la organización; si no, el admin lo expulsa.
 * El admin no puede salir sin delegar antes (RN-16): así nunca se queda sin admin
 * ni sin miembros (RN-10).
 */
export class QuitarMiembroUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		usuarioId: number,
		organizacionId: number,
		objetivoId: number,
	): Promise<void> {
		const yo = await this.organizacionRepository.buscarPorId(
			usuarioId,
			organizacionId,
		);
		if (!yo) throw new OrganizacionNoEncontradaError();

		const sale = objetivoId === usuarioId;
		if (sale && yo.isAdmin) throw new AdminNoPuedeSalirError();
		if (!sale) {
			if (!yo.isAdmin) throw new SoloAdminOrganizacionError();
			if (
				!(await this.organizacionRepository.buscarPorId(
					objetivoId,
					organizacionId,
				))
			) {
				throw new MiembroNoEncontradoError();
			}
		}

		await this.uow.ejecutar(async () => {
			await this.organizacionRepository.quitarMiembro(
				organizacionId,
				objetivoId,
			);
			await this.eventBus.publish(
				new MiembroQuitadoEvent({
					organizacionId,
					usuarioId: objetivoId,
					expulsado: !sale,
				}),
			);
		});
	}
}
