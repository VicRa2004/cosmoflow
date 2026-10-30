import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import type { AccesoOrganizacion } from "@/modules/organizacion";
import { ProyectoActualizadoEvent } from "../../domain/event/ProyectoActualizadoEvent";
import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";
import type {
	ActualizarProyectoDto,
	AmbitoProyecto,
	ProyectoDto,
} from "../dtos/ProyectoDto";
import { ProyectoMapper } from "../mappers/ProyectoMapper";
import { buscarProyecto } from "./buscarProyecto";
import { validarReferencias } from "./validarReferencias";

/** Datos, estado, equipos (sin bajar de uno) e integrantes (`proyectos:editar`). */
export class ActualizarProyectoUseCase {
	constructor(
		private readonly proyectoRepository: ProyectoRepository,
		private readonly acceso: AccesoOrganizacion,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoProyecto,
		id: number,
		dto: ActualizarProyectoDto,
	): Promise<ProyectoDto> {
		await this.acceso.exigir(usuarioId, organizacionId, "proyectos:editar");
		const proyecto = await buscarProyecto(
			this.proyectoRepository,
			organizacionId,
			id,
		);
		proyecto.actualizar(dto);
		await validarReferencias(this.proyectoRepository, organizacionId, dto);
		const actualizado = await this.uow.ejecutar(async () => {
			const guardado = await this.proyectoRepository.actualizar(proyecto);
			await this.eventBus.publish(
				new ProyectoActualizadoEvent({ organizacionId, proyectoId: id }),
			);
			return guardado;
		});
		return ProyectoMapper.toDto(actualizado);
	}
}
