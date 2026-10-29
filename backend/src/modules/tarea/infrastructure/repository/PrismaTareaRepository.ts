import { prisma } from "@/core/config/prisma";
import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { Prisma } from "@/generated/prisma/client";
import type {
	AmbitoTareas,
	TareaFiltros,
	TareaRepository,
} from "../../domain/repository/TareaRepository";
import { type DatosTarea, Tarea } from "../../domain/Tarea";

// Los tags borrados siguen en `tarea_tag`, pero ya no forman parte de la tarea.
const include = {
	tags: { where: { tag: { deletedAt: null } }, select: { tagId: true } },
	responsables: { select: { usuarioId: true }, orderBy: { usuarioId: "asc" } },
} satisfies Prisma.TareaInclude;

type PrismaTareaRecord = Prisma.TareaGetPayload<{ include: typeof include }>;

/** `@db.Date` llega como medianoche UTC: el día ISO es su parte de fecha. */
const aDia = (fecha: Date | null) => fecha?.toISOString().slice(0, 10) ?? null;
const aFecha = (dia: string | null) => (dia ? new Date(dia) : null);

export class PrismaTareaRepository implements TareaRepository {
	private toDomain(raw: PrismaTareaRecord): Tarea {
		return Tarea.reconstituir(
			raw.id,
			raw.usuarioId,
			{
				titulo: raw.titulo,
				contenido: raw.contenido,
				estado: raw.estado,
				prioridad: raw.prioridad,
				fechaInicio: aDia(raw.fechaInicio),
				fechaVencimiento: aDia(raw.fechaVencimiento),
				tagIds: raw.tags.map((t) => t.tagId),
			},
			{
				organizacionId: raw.organizacionId,
				equipoId: raw.equipoId,
				proyectoId: raw.proyectoId,
			},
			raw.responsables.map((r) => r.usuarioId),
		);
	}

	private columnas(datos: DatosTarea) {
		return {
			titulo: datos.titulo,
			contenido: datos.contenido,
			estado: datos.estado,
			prioridad: datos.prioridad,
			fechaInicio: aFecha(datos.fechaInicio),
			fechaVencimiento: aFecha(datos.fechaVencimiento),
		};
	}

	async buscar(
		ambito: AmbitoTareas,
		{ pagina, limite, busqueda, estado, tagId }: TareaFiltros,
	): Promise<Paginacion<Tarea>> {
		return this.paginar(
			{
				// Las personales son las suyas sin organización: las que movió ya no.
				...("usuarioId" in ambito
					? { usuarioId: ambito.usuarioId, organizacionId: null }
					: ambito),
				deletedAt: null,
				...(busqueda && {
					titulo: { contains: busqueda, mode: "insensitive" },
				}),
				...(estado && { estado }),
				...(tagId && { tags: { some: { tagId, tag: { deletedAt: null } } } }),
			},
			[{ createdAt: "desc" }, { id: "desc" }],
			pagina,
			limite,
		);
	}

	async buscarPendientes(
		usuarioId: number,
		{ pagina, limite }: { pagina: number; limite: number },
	): Promise<Paginacion<Tarea>> {
		return this.paginar(
			{
				OR: [
					{ usuarioId, organizacionId: null },
					{ responsables: { some: { usuarioId } } },
				],
				deletedAt: null,
				estado: { in: ["pendiente", "en_progreso"] },
			},
			[
				{ fechaVencimiento: { sort: "asc", nulls: "last" } },
				// El enum de Postgres ordena por declaración: baja < media < alta.
				{ prioridad: "desc" },
				{ id: "asc" },
			],
			pagina,
			limite,
		);
	}

	private async paginar(
		where: Prisma.TareaWhereInput,
		orderBy: Prisma.TareaOrderByWithRelationInput[],
		pagina: number,
		limite: number,
	): Promise<Paginacion<Tarea>> {
		const [registros, totalElementos] = await prisma.$transaction([
			prisma.tarea.findMany({
				where,
				include,
				orderBy,
				skip: (pagina - 1) * limite,
				take: limite,
			}),
			prisma.tarea.count({ where }),
		]);

		return {
			datos: registros.map((registro) => this.toDomain(registro)),
			pagina,
			totalElementos,
			totalPaginas: Math.ceil(totalElementos / limite),
		};
	}

	async buscarPorId(id: number): Promise<Tarea | null> {
		const registro = await prisma.tarea.findFirst({
			where: { id, deletedAt: null },
			include,
		});
		return registro ? this.toDomain(registro) : null;
	}

	// Consulta la tabla del módulo `tag` sin importar su código: solo el dato.
	async sonTagsDe(
		dueno: { usuarioId: number } | { organizacionId: number },
		tagIds: number[],
	): Promise<boolean> {
		const unicos = [...new Set(tagIds)];
		const propios = await prisma.tag.count({
			where: { id: { in: unicos }, ...dueno, deletedAt: null },
		});
		return propios === unicos.length;
	}

	async crear(data: Tarea): Promise<Tarea> {
		const datos = data.getDatos();
		const registro = await prisma.tarea.create({
			data: {
				usuarioId: data.getUsuarioId(),
				...data.getUbicacion(),
				...this.columnas(datos),
				tags: { create: datos.tagIds.map((tagId) => ({ tagId })) },
				responsables: {
					createMany: {
						data: data.getResponsableIds().map((usuarioId) => ({ usuarioId })),
					},
				},
			},
			include,
		});
		return this.toDomain(registro);
	}

	async actualizar(data: Tarea): Promise<Tarea> {
		const datos = data.getDatos();
		const registro = await prisma.tarea.update({
			where: { id: data.getId() },
			data: {
				...data.getUbicacion(),
				...this.columnas(datos),
				tags: {
					deleteMany: {},
					create: datos.tagIds.map((tagId) => ({ tagId })),
				},
				responsables: {
					deleteMany: {},
					createMany: {
						data: data.getResponsableIds().map((usuarioId) => ({ usuarioId })),
					},
				},
			},
			include,
		});
		return this.toDomain(registro);
	}

	async eliminar(id: number): Promise<void> {
		await prisma.tarea.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}
}
