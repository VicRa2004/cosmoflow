import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import type { AccesoOrganizacion } from "@/modules/organizacion";
import { ProyectoEliminadoEvent } from "../../domain/event/ProyectoEliminadoEvent";
import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";
import type { AmbitoProyecto } from "../dtos/ProyectoDto";
import { buscarProyecto } from "./buscarProyecto";

export class EliminarProyectoUseCase {
	constructor(
		private readonly proyectoRepository: ProyectoRepository,
		private readonly acceso: AccesoOrganizacion,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoProyecto,
		id: number,
	): Promise<void> {
		await this.acceso.exigir(usuarioId, organizacionId, "proyectos:eliminar");
		await buscarProyecto(this.proyectoRepository, organizacionId, id);
		await this.uow.ejecutar(async () => {
			await this.proyectoRepository.eliminar(organizacionId, id);
			await this.eventBus.publish(
				new ProyectoEliminadoEvent({ organizacionId, proyectoId: id }),
			);
		});
	}
}
