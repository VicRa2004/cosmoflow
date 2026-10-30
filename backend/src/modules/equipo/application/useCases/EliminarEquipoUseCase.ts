import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import type { AccesoOrganizacion } from "@/modules/organizacion";
import type { BajaEquipo } from "../../domain/BajaEquipo";
import { EquipoEliminadoEvent } from "../../domain/event/EquipoEliminadoEvent";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";
import type { AmbitoEquipo } from "../dtos/EquipoDto";
import { buscarEquipo } from "./buscarEquipo";

export class EliminarEquipoUseCase {
	constructor(
		private readonly equipoRepository: EquipoRepository,
		private readonly acceso: AccesoOrganizacion,
		private readonly baja: BajaEquipo,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoEquipo,
		id: number,
	): Promise<void> {
		await this.acceso.exigir(usuarioId, organizacionId, "equipos:eliminar");
		await buscarEquipo(this.equipoRepository, organizacionId, id);
		await this.baja.comprobar(organizacionId, id);
		await this.uow.ejecutar(async () => {
			await this.equipoRepository.eliminar(organizacionId, id);
			await this.eventBus.publish(
				new EquipoEliminadoEvent({ organizacionId, equipoId: id }),
			);
		});
	}
}
