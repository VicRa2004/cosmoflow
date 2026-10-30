import { prisma } from "@/core/config/prisma";
import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { Prisma } from "@/generated/prisma/client";
import { Nota } from "../../domain/Nota";
import type {
	AmbitoNotas,
	NotaFiltros,
	NotaRepository,
} from "../../domain/repository/NotaRepository";

// Los tags borrados siguen en `nota_tag`, pero ya no forman parte de la nota.
const include = {
	tags: { where: { tag: { deletedAt: null } }, select: { tagId: true } },
} satisfies Prisma.NotaInclude;

type PrismaNotaRecord = Prisma.NotaGetPayload<{ include: typeof include }>;

export class PrismaNotaRepository implements NotaRepository {
	private toDomain(raw: PrismaNotaRecord): Nota {
		return Nota.reconstituir(
			raw.id,
			raw.usuarioId,
			{
				titulo: raw.titulo,
				contenido: raw.contenido,
				tagIds: raw.tags.map((t) => t.tagId),
			},
			raw.updatedAt,
			raw.organizacionId && raw.proyectoId
				? { organizacionId: raw.organizacionId, proyectoId: raw.proyectoId }
				: null,
		);
	}

	async buscar(
		ambito: AmbitoNotas,
		{ pagina, limite, busqueda, tagId }: NotaFiltros,
	): Promise<Paginacion<Nota>> {
		const where: Prisma.NotaWhereInput = {
			// Las personales son las suyas sin proyecto.
			...("usuarioId" in ambito
				? { usuarioId: ambito.usuarioId, proyectoId: null }
				: ambito),
			deletedAt: null,
			...(busqueda && {
				OR: [
					{ titulo: { contains: busqueda, mode: "insensitive" } },
					{ contenido: { contains: busqueda, mode: "insensitive" } },
				],
			}),
			...(tagId && { tags: { some: { tagId, tag: { deletedAt: null } } } }),
		};

		const [registros, totalElementos] = await prisma.$transaction([
			prisma.nota.findMany({
				where,
				include,
				orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
				skip: (pagina - 1) * limite,
				take: limite,
			}),
			prisma.nota.count({ where }),
		]);

		return {
			datos: registros.map((registro) => this.toDomain(registro)),
			pagina,
			totalElementos,
			totalPaginas: Math.ceil(totalElementos / limite),
		};
	}

	async buscarPorId(id: number): Promise<Nota | null> {
		const registro = await prisma.nota.findFirst({
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

	async crear(data: Nota): Promise<Nota> {
		const { titulo, contenido, tagIds } = data.getDatos();
		const registro = await prisma.nota.create({
			data: {
				usuarioId: data.getUsuarioId(),
				...data.getProyecto(),
				titulo,
				contenido,
				tags: { create: tagIds.map((tagId) => ({ tagId })) },
			},
			include,
		});
		return this.toDomain(registro);
	}

	async actualizar(data: Nota): Promise<Nota> {
		const { titulo, contenido, tagIds } = data.getDatos();
		const registro = await prisma.nota.update({
			where: { id: data.getId() },
			data: {
				titulo,
				contenido,
				tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) },
			},
			include,
		});
		return this.toDomain(registro);
	}

	async eliminar(id: number): Promise<void> {
		await prisma.nota.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}

	async hacerPersonales(proyectoId: number): Promise<void> {
		await prisma.$transaction([
			prisma.notaTag.deleteMany({ where: { nota: { proyectoId } } }),
			prisma.nota.updateMany({
				where: { proyectoId },
				data: { organizacionId: null, proyectoId: null },
			}),
		]);
	}
}
