import { prisma } from "@/core/config/prisma";
import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type {
	TagFiltros,
	TagRepository,
} from "../../domain/repository/TagRepository";
import { type DuenoTag, Tag } from "../../domain/Tag";

interface PrismaTagRecord {
	id: number;
	usuarioId: number | null;
	organizacionId: number | null;
	nombre: string;
}

/** El `where` del dueño. El CHECK `tag_un_solo_dueno` garantiza que el otro es null. */
const deDueno = (dueno: DuenoTag) =>
	"usuarioId" in dueno
		? { usuarioId: dueno.usuarioId }
		: { organizacionId: dueno.organizacionId };

export class PrismaTagRepository implements TagRepository {
	private toDomain(raw: PrismaTagRecord): Tag {
		const dueno: DuenoTag =
			raw.organizacionId !== null
				? { organizacionId: raw.organizacionId }
				: { usuarioId: raw.usuarioId as number };
		return Tag.reconstituir(raw.id, dueno, raw.nombre);
	}

	async buscar(
		dueno: DuenoTag,
		{ pagina, limite, nombre }: TagFiltros,
	): Promise<Paginacion<Tag>> {
		const where = {
			...deDueno(dueno),
			deletedAt: null,
			...(nombre && {
				nombre: { contains: nombre, mode: "insensitive" as const },
			}),
		};

		const [registros, totalElementos] = await prisma.$transaction([
			prisma.tag.findMany({
				where,
				skip: (pagina - 1) * limite,
				take: limite,
				orderBy: { nombre: "asc" },
			}),
			prisma.tag.count({ where }),
		]);

		return {
			datos: registros.map((registro) => this.toDomain(registro)),
			pagina,
			totalElementos,
			totalPaginas: Math.ceil(totalElementos / limite),
		};
	}

	async buscarPorId(dueno: DuenoTag, id: number): Promise<Tag | null> {
		const registro = await prisma.tag.findFirst({
			where: { id, ...deDueno(dueno), deletedAt: null },
		});
		return registro ? this.toDomain(registro) : null;
	}

	async buscarPorNombre(dueno: DuenoTag, nombre: string): Promise<Tag | null> {
		const registro = await prisma.tag.findFirst({
			where: {
				...deDueno(dueno),
				deletedAt: null,
				nombre: { equals: nombre, mode: "insensitive" },
			},
		});
		return registro ? this.toDomain(registro) : null;
	}

	async crear(data: Tag): Promise<Tag> {
		const registro = await prisma.tag.create({
			data: { ...deDueno(data.getDueno()), nombre: data.getNombre() },
		});
		return this.toDomain(registro);
	}

	async actualizar(data: Tag): Promise<Tag> {
		const registro = await prisma.tag.update({
			where: { id: data.getId() },
			data: { nombre: data.getNombre() },
		});
		return this.toDomain(registro);
	}

	async eliminar(id: number): Promise<void> {
		await prisma.tag.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}
}
