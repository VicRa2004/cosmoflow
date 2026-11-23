import { prisma } from "@/core/config/prisma";
import type {
	DatosPlantilla,
	DuenoPlantilla,
	PlantillaTarea,
} from "../../domain/PlantillaTarea";
import type { PlantillaTareaRepository } from "../../domain/repository/PlantillaTareaRepository";

/** El CHECK `plantilla_tarea_un_solo_dueno` garantiza que el otro campo es null. */
const deDueno = (dueno: DuenoPlantilla) =>
	"usuarioId" in dueno
		? { usuarioId: dueno.usuarioId }
		: { organizacionId: dueno.organizacionId };

const select = {
	id: true,
	nombre: true,
	titulo: true,
	contenido: true,
	prioridad: true,
	color: true,
	subtareas: true,
} as const;

export class PrismaPlantillaTareaRepository
	implements PlantillaTareaRepository
{
	buscar(dueno: DuenoPlantilla): Promise<PlantillaTarea[]> {
		return prisma.plantillaTarea.findMany({
			where: deDueno(dueno),
			select,
			orderBy: [{ nombre: "asc" }, { id: "asc" }],
			// shortcut: tope de 200 plantillas por dueño, paginar si alguien llega a tener más
			take: 200,
		});
	}

	crear(dueno: DuenoPlantilla, datos: DatosPlantilla): Promise<PlantillaTarea> {
		return prisma.plantillaTarea.create({
			data: { ...deDueno(dueno), ...datos },
			select,
		});
	}

	async actualizar(
		dueno: DuenoPlantilla,
		id: number,
		cambios: Partial<DatosPlantilla>,
	): Promise<PlantillaTarea | null> {
		const { count } = await prisma.plantillaTarea.updateMany({
			where: { id, ...deDueno(dueno) },
			data: cambios,
		});
		if (count === 0) return null;
		return prisma.plantillaTarea.findUnique({ where: { id }, select });
	}

	async eliminar(dueno: DuenoPlantilla, id: number): Promise<boolean> {
		const { count } = await prisma.plantillaTarea.deleteMany({
			where: { id, ...deDueno(dueno) },
		});
		return count === 1;
	}
}
