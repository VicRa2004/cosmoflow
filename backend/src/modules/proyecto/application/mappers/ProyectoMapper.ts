import type { Proyecto } from "../../domain/Proyecto";
import type {
	ProgresoProyecto,
	ProyectoRepository,
} from "../../domain/repository/ProyectoRepository";
import type { ProyectoDto } from "../dtos/ProyectoDto";

export const ProyectoMapper = {
	toDto(
		proyecto: Proyecto,
		progreso: ProgresoProyecto = { tareas: 0, completadas: 0 },
	): ProyectoDto {
		return {
			id: proyecto.getId(),
			nombre: proyecto.getNombre(),
			descripcion: proyecto.getDescripcion(),
			estado: proyecto.getEstado(),
			color: proyecto.getColor(),
			fechaInicio: proyecto.getFechaInicio(),
			fechaFin: proyecto.getFechaFin(),
			progreso,
			equipoIds: [...proyecto.getEquipoIds()],
			integranteIds: [...proyecto.getIntegranteIds()],
		};
	},

	/** Con el progreso de sus tareas, en una sola consulta para todos. */
	async conProgreso(
		repo: ProyectoRepository,
		proyectos: Proyecto[],
	): Promise<ProyectoDto[]> {
		const progreso = await repo.progreso(proyectos.map((p) => p.getId()));
		return proyectos.map((p) =>
			ProyectoMapper.toDto(p, progreso.get(p.getId())),
		);
	},
};
