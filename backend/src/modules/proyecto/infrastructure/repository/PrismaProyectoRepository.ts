import { prisma } from "@/core/config/prisma";
import { type EstadoProyecto, Proyecto } from "../../domain/Proyecto";
import type { ProyectoRepository } from "../../domain/repository/ProyectoRepository";

// Un equipo borrado deja de contar sin tocar `proyecto_equipo`.
const include = {
	equipos: {
		where: { equipo: { deletedAt: null } },
		orderBy: { equipoId: "asc" },
	},
	integrantes: { orderBy: { usuarioId: "asc" } },
} as const;

interface PrismaProyectoRecord {
	id: number;
	organizacionId: number;
	nombre: string;
	descripcion: string;
	estado: EstadoProyecto;
	equipos: { equipoId: number }[];
	integrantes: { usuarioId: number }[];
}

export class PrismaProyectoRepository implements ProyectoRepository {
	private toDomain(raw: PrismaProyectoRecord): Proyecto {
		return Proyecto.reconstituir(raw.id, raw.organizacionId, {
			nombre: raw.nombre,
			descripcion: raw.descripcion,
			estado: raw.estado,
			equipoIds: raw.equipos.map((e) => e.equipoId),
			integranteIds: raw.integrantes.map((i) => i.usuarioId),
		});
	}

	private datos(proyecto: Proyecto) {
		return {
			nombre: proyecto.getNombre(),
			descripcion: proyecto.getDescripcion(),
			estado: proyecto.getEstado(),
			equipos: {
				createMany: {
					data: proyecto.getEquipoIds().map((equipoId) => ({ equipoId })),
				},
			},
			integrantes: {
				createMany: {
					data: proyecto.getIntegranteIds().map((usuarioId) => ({ usuarioId })),
				},
			},
		};
	}

	async buscar(
		organizacionId: number,
		{ estado }: { estado?: EstadoProyecto },
	) {
		// shortcut: sin paginar; paginar si una organización llega a cientos de proyectos.
		const registros = await prisma.proyecto.findMany({
			where: { organizacionId, deletedAt: null, estado },
			include,
			orderBy: { nombre: "asc" },
		});
		return registros.map((r) => this.toDomain(r));
	}

	async buscarPorId(organizacionId: number, id: number) {
		const registro = await prisma.proyecto.findFirst({
			where: { id, organizacionId, deletedAt: null },
			include,
		});
		return registro ? this.toDomain(registro) : null;
	}

	async crear(proyecto: Proyecto): Promise<Proyecto> {
		const registro = await prisma.proyecto.create({
			data: {
				organizacionId: proyecto.getOrganizacionId(),
				...this.datos(proyecto),
			},
			include,
		});
		return this.toDomain(registro);
	}

	async actualizar(proyecto: Proyecto): Promise<Proyecto> {
		const id = proyecto.getId();
		const [, , registro] = await prisma.$transaction([
			prisma.proyectoEquipo.deleteMany({ where: { proyectoId: id } }),
			prisma.integranteProyecto.deleteMany({ where: { proyectoId: id } }),
			prisma.proyecto.update({
				where: { id },
				data: this.datos(proyecto),
				include,
			}),
		]);
		return this.toDomain(registro);
	}

	async eliminar(organizacionId: number, id: number): Promise<void> {
		await prisma.proyecto.update({
			where: { organizacionId_id: { organizacionId, id } },
			data: { deletedAt: new Date() },
		});
	}

	async sonEquipos(organizacionId: number, equipoIds: number[]) {
		const unicos = [...new Set(equipoIds)];
		const encontrados = await prisma.equipo.count({
			where: { id: { in: unicos }, organizacionId, deletedAt: null },
		});
		return encontrados === unicos.length;
	}

	async sonMiembros(organizacionId: number, usuarioIds: number[]) {
		const unicos = [...new Set(usuarioIds)];
		const encontrados = await prisma.miembroOrganizacion.count({
			where: { organizacionId, usuarioId: { in: unicos } },
		});
		return encontrados === unicos.length;
	}

	async proyectosSoloCon(organizacionId: number, equipoId: number) {
		const proyectos = await prisma.proyecto.findMany({
			where: {
				organizacionId,
				deletedAt: null,
				equipos: { some: { equipoId } },
			},
			select: {
				nombre: true,
				equipos: {
					where: { equipo: { deletedAt: null } },
					select: { equipoId: true },
				},
			},
		});
		return proyectos
			.filter((p) => p.equipos.every((e) => e.equipoId === equipoId))
			.map((p) => p.nombre);
	}
}
