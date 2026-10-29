import { prisma } from "@/core/config/prisma";
import { Equipo } from "../../domain/Equipo";
import type { EquipoRepository } from "../../domain/repository/EquipoRepository";

// Un tag borrado deja de clasificar el equipo sin tocar `equipo_tag`.
const include = {
	miembros: { orderBy: { usuarioId: "asc" } },
	tags: { where: { tag: { deletedAt: null } } },
} as const;

interface PrismaEquipoRecord {
	id: number;
	organizacionId: number;
	nombre: string;
	descripcion: string;
	color: string;
	miembros: {
		usuarioId: number;
		isLider: boolean;
		puedeCrearTareas: boolean;
	}[];
	tags: { tagId: number }[];
}

export class PrismaEquipoRepository implements EquipoRepository {
	private toDomain(raw: PrismaEquipoRecord): Equipo {
		return Equipo.reconstituir(raw.id, raw.organizacionId, {
			nombre: raw.nombre,
			descripcion: raw.descripcion,
			color: raw.color,
			liderId: raw.miembros.find((m) => m.isLider)?.usuarioId ?? null,
			miembros: raw.miembros.map(({ usuarioId, puedeCrearTareas }) => ({
				usuarioId,
				puedeCrearTareas,
			})),
			tagIds: raw.tags.map((t) => t.tagId),
		});
	}

	private relaciones(equipo: Equipo) {
		return {
			miembros: {
				createMany: {
					data: equipo.getMiembros().map((m) => ({
						usuarioId: m.usuarioId,
						puedeCrearTareas: m.puedeCrearTareas,
						isLider: m.usuarioId === equipo.getLiderId(),
					})),
				},
			},
			tags: {
				createMany: { data: equipo.getTagIds().map((tagId) => ({ tagId })) },
			},
		};
	}

	async buscar(organizacionId: number, { tagId }: { tagId?: number }) {
		// shortcut: sin paginar; paginar si una organización llega a cientos de equipos.
		const registros = await prisma.equipo.findMany({
			where: {
				organizacionId,
				deletedAt: null,
				...(tagId && { tags: { some: { tagId } } }),
			},
			include,
			orderBy: { nombre: "asc" },
		});
		return registros.map((r) => this.toDomain(r));
	}

	async buscarPorId(organizacionId: number, id: number) {
		const registro = await prisma.equipo.findFirst({
			where: { id, organizacionId, deletedAt: null },
			include,
		});
		return registro ? this.toDomain(registro) : null;
	}

	async crear(equipo: Equipo): Promise<Equipo> {
		const registro = await prisma.equipo.create({
			data: {
				organizacionId: equipo.getOrganizacionId(),
				nombre: equipo.getNombre(),
				descripcion: equipo.getDescripcion(),
				color: equipo.getColor(),
				...this.relaciones(equipo),
			},
			include,
		});
		return this.toDomain(registro);
	}

	async actualizar(equipo: Equipo): Promise<Equipo> {
		const id = equipo.getId();
		const [, , registro] = await prisma.$transaction([
			prisma.miembroEquipo.deleteMany({ where: { equipoId: id } }),
			prisma.equipoTag.deleteMany({ where: { equipoId: id } }),
			prisma.equipo.update({
				where: { id },
				data: {
					nombre: equipo.getNombre(),
					descripcion: equipo.getDescripcion(),
					color: equipo.getColor(),
					...this.relaciones(equipo),
				},
				include,
			}),
		]);
		return this.toDomain(registro);
	}

	async eliminar(organizacionId: number, id: number): Promise<void> {
		await prisma.equipo.update({
			where: { organizacionId_id: { organizacionId, id } },
			data: { deletedAt: new Date() },
		});
	}

	async sonMiembros(organizacionId: number, usuarioIds: number[]) {
		const unicos = [...new Set(usuarioIds)];
		const encontrados = await prisma.miembroOrganizacion.count({
			where: { organizacionId, usuarioId: { in: unicos } },
		});
		return encontrados === unicos.length;
	}

	async sonTags(organizacionId: number, tagIds: number[]) {
		const unicos = [...new Set(tagIds)];
		if (unicos.length === 0) return true;
		const encontrados = await prisma.tag.count({
			where: { id: { in: unicos }, organizacionId, deletedAt: null },
		});
		return encontrados === unicos.length;
	}

	async equiposAlMinimo(organizacionId: number, usuarioId: number) {
		const equipos = await prisma.equipo.findMany({
			where: {
				organizacionId,
				deletedAt: null,
				miembros: { some: { usuarioId } },
			},
			select: { nombre: true, _count: { select: { miembros: true } } },
		});
		return equipos.filter((e) => e._count.miembros <= 2).map((e) => e.nombre);
	}
}
