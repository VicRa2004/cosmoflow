import { prisma } from "@/core/config/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { tareaVisiblePara } from "@/modules/tarea";
import type {
	BusquedaRepository,
	ResultadosBusqueda,
} from "../../domain/repository/BusquedaRepository";

/**
 * Consulta las tablas de tareas, notas, proyectos y equipos sin importar sus módulos:
 * solo el dato. La visibilidad replica la de cada listado (los e2e lo comprueban).
 * `contains` + `insensitive` es ILIKE, que usa los índices de pg_trgm.
 */
export class PrismaBusquedaRepository implements BusquedaRepository {
	async buscar(
		usuarioId: number,
		texto: string,
		limite: number,
	): Promise<ResultadosBusqueda> {
		const contiene = { contains: texto, mode: "insensitive" as const };
		const esMiembro = { some: { usuarioId } };
		// Proyectos y equipos: solo en organizaciones vivas de las que es miembro.
		const deSuOrganizacion = {
			organizacion: { deletedAt: null, miembros: esMiembro },
		};
		const esAdmin = {
			organizacion: { miembros: { some: { usuarioId, isAdmin: true } } },
		};

		const [tareas, notas, proyectos, equipos] = await prisma.$transaction([
			prisma.tarea.findMany({
				where: {
					deletedAt: null,
					AND: [
						tareaVisiblePara(usuarioId),
						{ OR: [{ titulo: contiene }, { contenido: contiene }] },
					],
				},
				select: { id: true, titulo: true },
				orderBy: { id: "desc" },
				take: limite,
			}),
			prisma.nota.findMany({
				where: {
					deletedAt: null,
					AND: [
						// Mismas reglas que `ProyectosNota`: personales suyas o de un proyecto del que es miembro.
						{
							OR: [
								{ usuarioId, proyectoId: null },
								{
									proyecto: {
										deletedAt: null,
										OR: [
											{ integrantes: esMiembro },
											{
												equipos: { some: { equipo: { miembros: esMiembro } } },
											},
										],
									},
								},
							],
						},
						{ OR: [{ titulo: contiene }, { contenido: contiene }] },
					],
				},
				select: { id: true, titulo: true },
				orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
				take: limite,
			}),
			prisma.proyecto.findMany({
				where: {
					deletedAt: null,
					nombre: contiene,
					...deSuOrganizacion,
					OR: [
						esAdmin,
						{ integrantes: esMiembro },
						{
							equipos: {
								some: { equipo: { deletedAt: null, miembros: esMiembro } },
							},
						},
					],
				} satisfies Prisma.ProyectoWhereInput,
				select: { id: true, nombre: true, organizacionId: true },
				orderBy: { nombre: "asc" },
				take: limite,
			}),
			prisma.equipo.findMany({
				where: {
					deletedAt: null,
					nombre: contiene,
					...deSuOrganizacion,
					OR: [esAdmin, { miembros: esMiembro }],
				} satisfies Prisma.EquipoWhereInput,
				select: { id: true, nombre: true, organizacionId: true },
				orderBy: { nombre: "asc" },
				take: limite,
			}),
		]);
		return { tareas, notas, proyectos, equipos };
	}
}
