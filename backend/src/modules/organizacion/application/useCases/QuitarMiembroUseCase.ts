import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import { AdminNoPuedeSalirError } from "../../domain/error/AdminNoPuedeSalirError";
import { MiembroNoEncontradoError } from "../../domain/error/MiembroNoEncontradoError";
import { OrganizacionNoEncontradaError } from "../../domain/error/OrganizacionNoEncontradaError";
import { AdminNoExpulsableError } from "../../domain/error/AdminNoExpulsableError";
import { SinPermisoOrganizacionError } from "../../domain/error/SinPermisoOrganizacionError";
import { permisosEfectivos } from "../../domain/permisosOrganizacion";
import { MiembroQuitadoEvent } from "../../domain/event/MiembroQuitadoEvent";
import type { OrganizacionRepository } from "../../domain/repository/OrganizacionRepository";
import type { SalidaMiembro } from "../../domain/SalidaMiembro";

/**
 * Con `objetivoId` = quien pide, sale de la organización; si no, lo expulsa quien tenga
 * `miembros:expulsar` (el admin siempre). Al admin no se le expulsa.
 * El admin no puede salir sin delegar antes (RN-16): así nunca se queda sin admin
 * ni sin miembros (RN-10). Otros módulos pueden bloquearlo (`SalidaMiembro`, RN-26).
 */
export class QuitarMiembroUseCase {
	constructor(
		private readonly organizacionRepository: OrganizacionRepository,
		private readonly salida: SalidaMiembro,
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
			if (!permisosEfectivos(yo).includes("miembros:expulsar")) {
				throw new SinPermisoOrganizacionError();
			}
			const objetivo = await this.organizacionRepository.buscarPorId(
				objetivoId,
				organizacionId,
			);
			if (!objetivo) throw new MiembroNoEncontradoError();
			if (objetivo.isAdmin) throw new AdminNoExpulsableError();
		}

		await this.uow.ejecutar(async () => {
			await this.salida.comprobar(organizacionId, objetivoId);
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
