import { prisma } from "@/core/config/prisma";
import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type {
	TagFiltros,
	TagRepository,
} from "../../domain/repository/TagRepository";
import { Tag } from "../../domain/Tag";

interface PrismaTagRecord {
	id: number;
	usuarioId: number;
	nombre: string;
}

export class PrismaTagRepository implements TagRepository {
	private toDomain(raw: PrismaTagRecord): Tag {
		return Tag.reconstituir(raw.id, raw.usuarioId, raw.nombre);
	}

	async buscar(
		usuarioId: number,
		{ pagina, limite, nombre }: TagFiltros,
	): Promise<Paginacion<Tag>> {
		const where = {
			usuarioId,
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

	async buscarPorId(usuarioId: number, id: number): Promise<Tag | null> {
		const registro = await prisma.tag.findFirst({
			where: { id, usuarioId, deletedAt: null },
		});
		return registro ? this.toDomain(registro) : null;
	}

	async buscarPorNombre(
		usuarioId: number,
		nombre: string,
	): Promise<Tag | null> {
		const registro = await prisma.tag.findFirst({
			where: {
				usuarioId,
				deletedAt: null,
				nombre: { equals: nombre, mode: "insensitive" },
			},
		});
		return registro ? this.toDomain(registro) : null;
	}

	async crear(data: Tag): Promise<Tag> {
		const registro = await prisma.tag.create({
			data: { usuarioId: data.getUsuarioId(), nombre: data.getNombre() },
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
