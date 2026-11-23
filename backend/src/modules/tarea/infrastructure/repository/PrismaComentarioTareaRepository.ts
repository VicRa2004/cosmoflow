import { prisma } from "@/core/config/prisma";
import type { Paginacion } from "@/core/shared/domain/Paginacion";
import type { Prisma } from "@/generated/prisma/client";
import type {
	ComentarioTarea,
	ComentarioTareaRepository,
} from "../../domain/repository/ComentarioTareaRepository";

const include = {
	autor: { select: { nombre: true, avatar: true } },
} satisfies Prisma.ComentarioTareaInclude;

type Registro = Prisma.ComentarioTareaGetPayload<{ include: typeof include }>;

const aDominio = ({ autor, ...resto }: Registro): ComentarioTarea => ({
	...resto,
	autorNombre: autor.nombre,
	autorAvatar: autor.avatar,
});

export class PrismaComentarioTareaRepository
	implements ComentarioTareaRepository
{
	async listar(
		tareaId: number,
		{ pagina, limite }: { pagina: number; limite: number },
	): Promise<Paginacion<ComentarioTarea>> {
		const where = { tareaId };
		const [registros, totalElementos] = await prisma.$transaction([
			prisma.comentarioTarea.findMany({
				where,
				include,
				orderBy: { id: "asc" },
				skip: (pagina - 1) * limite,
				take: limite,
			}),
			prisma.comentarioTarea.count({ where }),
		]);
		return {
			datos: registros.map(aDominio),
			pagina,
			totalElementos,
			totalPaginas: Math.ceil(totalElementos / limite),
		};
	}

	async buscarPorId(
		tareaId: number,
		id: number,
	): Promise<ComentarioTarea | null> {
		const registro = await prisma.comentarioTarea.findFirst({
			where: { id, tareaId },
			include,
		});
		return registro ? aDominio(registro) : null;
	}

	async crear(datos: {
		tareaId: number;
		autorId: number;
		contenido: string;
		padreId?: number | null;
	}): Promise<ComentarioTarea> {
		return aDominio(
			await prisma.comentarioTarea.create({ data: datos, include }),
		);
	}

	async actualizar(id: number, contenido: string): Promise<ComentarioTarea> {
		return aDominio(
			await prisma.comentarioTarea.update({
				where: { id },
				data: { contenido, editadoEn: new Date() },
				include,
			}),
		);
	}

	async eliminar(id: number): Promise<void> {
		await prisma.comentarioTarea.delete({ where: { id } });
	}
}
