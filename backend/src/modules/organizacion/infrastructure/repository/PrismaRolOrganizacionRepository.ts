import { prisma } from "@/core/config/prisma";
import { esPermisoOrganizacion } from "../../domain/permisosOrganizacion";
import type { RolOrganizacionRepository } from "../../domain/repository/RolOrganizacionRepository";
import { RolOrganizacion } from "../../domain/RolOrganizacion";

interface PrismaRolRecord {
	id: number;
	organizacionId: number;
	nombre: string;
	permisos: string[];
}

export class PrismaRolOrganizacionRepository
	implements RolOrganizacionRepository
{
	private toDomain(raw: PrismaRolRecord): RolOrganizacion {
		// Un permiso retirado del catálogo deja de valer sin migrar los datos.
		return RolOrganizacion.reconstituir(
			raw.id,
			raw.organizacionId,
			raw.nombre,
			raw.permisos.filter(esPermisoOrganizacion),
		);
	}

	async buscar(organizacionId: number) {
		const registros = await prisma.rolOrganizacion.findMany({
			where: { organizacionId, deletedAt: null },
			include: { _count: { select: { miembros: true } } },
			orderBy: { nombre: "asc" },
		});
		return registros.map(({ _count, ...rol }) => ({
			rol: this.toDomain(rol),
			totalMiembros: _count.miembros,
		}));
	}

	async buscarPorId(organizacionId: number, id: number) {
		const registro = await prisma.rolOrganizacion.findFirst({
			where: { id, organizacionId, deletedAt: null },
		});
		return registro ? this.toDomain(registro) : null;
	}

	async buscarPorNombre(organizacionId: number, nombre: string) {
		const registro = await prisma.rolOrganizacion.findFirst({
			where: {
				organizacionId,
				deletedAt: null,
				nombre: { equals: nombre, mode: "insensitive" },
			},
		});
		return registro ? this.toDomain(registro) : null;
	}

	async contarMiembros(rolId: number): Promise<number> {
		return prisma.miembroRolOrganizacion.count({ where: { rolId } });
	}

	async sonRolesDe(organizacionId: number, ids: number[]): Promise<boolean> {
		if (ids.length === 0) return true;
		const vivos = await prisma.rolOrganizacion.count({
			where: { id: { in: ids }, organizacionId, deletedAt: null },
		});
		return vivos === ids.length;
	}

	async crear(data: RolOrganizacion): Promise<RolOrganizacion> {
		const registro = await prisma.rolOrganizacion.create({
			data: {
				organizacionId: data.getOrganizacionId(),
				nombre: data.getNombre(),
				permisos: data.getPermisos(),
			},
		});
		return this.toDomain(registro);
	}

	async actualizar(data: RolOrganizacion): Promise<RolOrganizacion> {
		const registro = await prisma.rolOrganizacion.update({
			where: { id: data.getId() },
			data: { nombre: data.getNombre(), permisos: data.getPermisos() },
		});
		return this.toDomain(registro);
	}

	async eliminar(organizacionId: number, id: number): Promise<void> {
		await prisma.$transaction([
			prisma.miembroRolOrganizacion.deleteMany({
				where: { organizacionId, rolId: id },
			}),
			prisma.rolOrganizacion.update({
				where: { id },
				data: { deletedAt: new Date() },
			}),
		]);
	}

	async asignar(
		organizacionId: number,
		usuarioId: number,
		rolIds: number[],
	): Promise<void> {
		await prisma.$transaction([
			prisma.miembroRolOrganizacion.deleteMany({
				where: { organizacionId, usuarioId },
			}),
			prisma.miembroRolOrganizacion.createMany({
				data: rolIds.map((rolId) => ({ organizacionId, usuarioId, rolId })),
			}),
		]);
	}
}
