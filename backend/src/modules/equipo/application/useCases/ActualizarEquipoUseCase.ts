import type { EventBus } from "@/core/shared/domain/events/EventBus";
import type { UnitOfWork } from "@/core/shared/domain/UnitOfWork";
import type { AccesoOrganizacion } from "@/modules/organizacion";
import { EquipoActualizadoEvent } from "../../domain/event/EquipoActualizadoEvent";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";
import type {
	ActualizarEquipoDto,
	AmbitoEquipo,
	EquipoDto,
} from "../dtos/EquipoDto";
import { EquipoMapper } from "../mappers/EquipoMapper";
import { buscarEquipo } from "./buscarEquipo";
import { validarReferencias } from "./validarReferencias";

/** Datos, miembros, líder y tags (`equipos:editar`). */
export class ActualizarEquipoUseCase {
	constructor(
		private readonly equipoRepository: EquipoRepository,
		private readonly acceso: AccesoOrganizacion,
		private readonly eventBus: EventBus,
		private readonly uow: UnitOfWork,
	) {}

	async ejecutar(
		{ usuarioId, organizacionId }: AmbitoEquipo,
		id: number,
		dto: ActualizarEquipoDto,
	): Promise<EquipoDto> {
		await this.acceso.exigir(usuarioId, organizacionId, "equipos:editar");
		const equipo = await buscarEquipo(
			this.equipoRepository,
			organizacionId,
			id,
		);
		equipo.actualizar(dto);
		await validarReferencias(this.equipoRepository, organizacionId, dto);
		const actualizado = await this.uow.ejecutar(async () => {
			const guardado = await this.equipoRepository.actualizar(equipo);
			await this.eventBus.publish(
				new EquipoActualizadoEvent({ organizacionId, equipoId: id }),
			);
			return guardado;
		});
		return EquipoMapper.toDto(actualizado);
	}
}
